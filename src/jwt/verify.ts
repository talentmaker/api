import {inlineTryPromise, pick} from "@luke-zhang-04/utils/cjs"
import {authTokenSchema} from "~/schemas"
import {decodeAndVerify} from "@luke-zhang-04/utils/cjs/node"
import {minsToMs} from "@luke-zhang-04/dateplus/dist/cjs/dateplus.min.cjs"

const idTokenExpiryMins = 30
const idTokenExpiryTime = minsToMs(idTokenExpiryMins)

const maxTokenLength = 400

class AuthenticationError extends Error {
    public override name = "AuthenticationError"

    public constructor(err: Error)

    public constructor(message: string)

    public constructor(errOrMessage: Error | string) {
        super(errOrMessage instanceof Error ? errOrMessage.message : errOrMessage)
    }
}

/**
 * Takes an id token and verifies it, and returns the user id if valid
 *
 * @param idToken - Custom auth token
 * @returns If there is a problem, return an Error. Otherwise, return the user id
 */
export const verifyId = async (
    idToken: string,
): Promise<
    | AuthenticationError
    | {
          uid: string
          isVerified: boolean
      }
> => {
    if (idToken.length > maxTokenLength) {
        return new AuthenticationError("Id token is too long")
    }

    const decryptedUserInfo = await inlineTryPromise(
        async () =>
            await authTokenSchema.validate(
                JSON.parse(decodeAndVerify(idToken, "sha3-256", process.env.KEY1, "base64url")),
                {stripUnknown: true, recursive: false},
            ),
    )

    // Check for validity property is done with yup

    if (decryptedUserInfo instanceof Error) {
        return new AuthenticationError(decryptedUserInfo)
    } else if (Date.now() > decryptedUserInfo.iat + idTokenExpiryTime) {
        return new AuthenticationError("This token is expired")
    }

    return pick(decryptedUserInfo, "uid", "isVerified")
}

export default verifyId
