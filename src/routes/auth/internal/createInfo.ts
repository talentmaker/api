import type {AwsIdTokenPayload} from "~/schemas/auth"
import type {CognitoUserSession} from "amazon-cognito-identity-js"
import type {UserInfo} from "../types"
import {encodeAndSign} from "@luke-zhang-04/utils/cjs/node"
import globals from "~/globals"
import {isOrganization} from "~/utils/auth"

/**
 * Take a cognito user and returns the user info that should be stored in the the clients memory
 *
 * @param user - Cognito user session
 * @returns {UserInfo} User information
 */
export const createInfo = async (user: CognitoUserSession): Promise<UserInfo> => {
    const {payload} = user.getIdToken()
    const isOrg = await isOrganization(payload.sub)

    return {
        idToken: await encodeAndSign(
            JSON.stringify({
                iat: Date.now(),
                uid: payload.sub as string,
                validity: globals.authTokenValidity,
                isVerified: Number(payload.email_verified as boolean),
            }),
            "sha3-256",
            process.env.KEY1,
            "base64url",
        ),
        email: payload.email as string,
        uid: payload.sub as string,
        username: payload.preferred_username as string,
        isVerified: payload.email_verified as boolean,
        isOrganization: isOrg,
    }
}

// istanbul ignore next
/**
 * Take the result from the Cognito Token endpoint and returns the user info that should be stored
 * in the the clients memory
 *
 * @param user - Cognito user session
 * @returns {UserInfo} User information
 */
export const createInfoFromTokenEndpoint = async (
    idTokenPayload: AwsIdTokenPayload,
): Promise<UserInfo> => {
    const isOrg = await isOrganization(idTokenPayload.sub)

    return {
        idToken: await encodeAndSign(
            JSON.stringify({
                iat: Date.now(),
                uid: idTokenPayload.sub as string,
                validity: globals.authTokenValidity,
                isVerified: Number(idTokenPayload.email_verified),
            }),
            "sha3-256",
            process.env.KEY1,
            "base64url",
        ),
        email: idTokenPayload.email,
        uid: idTokenPayload.sub,
        username: idTokenPayload.preferred_username,
        isVerified: idTokenPayload.email_verified,
        isOrganization: isOrg,
    }
}

export default {
    createInfo,
    createInfoFromTokenEndpoint,
}
