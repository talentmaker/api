import {UserInfo, getUserInfo, isOrganization} from "~/utils/auth"
import verifyQuiet from "./verify"

/**
 * Takes an id token and verifies it, and returns the user id if valid
 *
 * @param idToken - Custom auth token
 * @returns If there is a problem, throw an Error. Otherwise, return the user id
 */
export const verify = async (
    idToken: string,
): Promise<{
    uid: string
    isVerified: boolean
}> => {
    const verified = await verifyQuiet(idToken)

    if (verified instanceof Error) {
        throw verified
    }

    return verified
}

export type ExtendedUserInfo = {
    isVerified: boolean
    isOrganization: boolean
} & UserInfo

export const getUserFromToken = async (idToken: string): Promise<ExtendedUserInfo> => {
    const {uid, isVerified} = await verify(idToken)
    const user = await getUserInfo(uid)

    return {
        isVerified,
        isOrganization: await isOrganization(user.uid),
        ...user,
    }
}

export {getUserFromToken as getUser, verifyQuiet, verify as verifyId}

export default getUserFromToken
