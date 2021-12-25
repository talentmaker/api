/**
 * Auth utilities that can be used for anything
 */

import {AuthenticationError} from "~/routes/auth/internal/utils"
import db from "~/db"
import {pick} from "@luke-zhang-04/utils/cjs"

export type UserInfo = {
    username: string
    email: string
    uid: string
}

/**
 * Gets a user by username
 *
 * @param uid - Unique username (userid) of user to find
 * @returns User Info
 */
export const getUserInfo = async (uid: string): Promise<UserInfo> => {
    const dbUser = await db.user.findUnique({
        where: {
            uid,
        },
    })

    // istanbul ignore file
    if (dbUser === null) {
        throw new AuthenticationError(`Could not find user with uid ${uid}`)
    }

    return pick(dbUser, "email", "username", "uid")
}

export {getUserInfo as getUser}

/**
 * Find out if a user is an organization from ther subject
 */
export const isOrganization = async (uid: string): Promise<boolean> =>
    (await db.organization.count({
        where: {
            uid,
        },
    })) > 0
