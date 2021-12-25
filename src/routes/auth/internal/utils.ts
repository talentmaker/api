import * as AwsCognito from "amazon-cognito-identity-js"
import db from "~/db"
import {isErrorLike} from "@luke-zhang-04/utils/cjs"

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Hos a request to the Cognito token endpoint should look
 */
export type TokenRequest = {
    refreshToken: string
}

/* eslint-disable camelcase, @typescript-eslint/semi */
/**
 * Result from the Cognito token endpoint
 */
export type TokenEnpointResult = {
    id_token: string
    access_token: string
    expires_in: number
    token_type: "Bearer"
}
/* eslint-enable camelcase, @typescript-eslint/semi */

// istanbul ignore next
if (process.env.USER_POOL_ID === undefined || process.env.CLIENT_ID === undefined) {
    throw new Error("USER_POOL_ID or CLIENT_ID are undefined from env")
}

const poolData = {
    UserPoolId: process.env.USER_POOL_ID,
    ClientId: process.env.CLIENT_ID,
}

export const userPool = new AwsCognito.CognitoUserPool(poolData)

export class AuthenticationError extends Error {
    public override readonly name = "AuthenticationError"

    public constructor(err: unknown) {
        // istanbul ignore next
        super(isErrorLike(err) ? err.message : String(err))
    }
}

// istanbul ignore next
export const reqHasToken = (obj: {[key: string]: string}): obj is TokenRequest =>
    typeof obj.refreshToken === "string"

// istanbul ignore next
/**
 * Typeguard for the Cognito token endpoint
 *
 * @param obj - Object to compare against
 * @returns Obj is TokenEndpointResult
 */
export const tokenEndpointIsValid = (obj: {[key: string]: unknown}): obj is TokenEnpointResult =>
    typeof obj.id_token === "string" &&
    typeof obj.access_token === "string" &&
    typeof obj.expires_in === "number" &&
    obj.token_type === "Bearer"

/**
 * Register a user. Promise based 😀
 *
 * @param username - Username
 * @param email - Email
 * @param password - Password
 * @returns - Promise with Cognito user
 */
export const register = (
    username: string,
    email: string,
    password: string,
): Promise<AwsCognito.CognitoUser | undefined> => {
    const attributeList = [
        new AwsCognito.CognitoUserAttribute({
            Name: "preferred_username",
            Value: username,
        }),
        new AwsCognito.CognitoUserAttribute({
            Name: "email",
            Value: email,
        }),
    ]

    return new Promise((resolve, reject) => {
        userPool.signUp(email, password, attributeList, [], (err, result) => {
            // istanbul ignore next
            if (err) {
                reject(new AuthenticationError(err))
            }

            resolve(result?.user)
        })
    })
}

const writeUserAttributes = async (
    cognitoUser: AwsCognito.CognitoUser,
    uid: string,
): Promise<void> => {
    const dbUser = await db.user.findUnique({
        where: {
            uid,
        },
    })

    if (dbUser !== null) {
        return
    }

    const userAttributes = await new Promise<AwsCognito.CognitoUserAttribute[] | undefined>(
        (resolve, reject) =>
            cognitoUser.getUserAttributes((err, res) => (err ? reject(err) : resolve(res))),
    )

    let email = ""
    let preferredUsername = ""

    if (userAttributes) {
        for (const attrib of userAttributes) {
            // istanbul ignore else
            if (attrib.Name === "email" && attrib.Value) {
                email = attrib.Value
            } else if (attrib.Name === "preferred_username" && attrib.Value) {
                preferredUsername = attrib.Value
            }

            // istanbul ignore next
            if (email && preferredUsername) {
                break
            }
        }
    }

    await db.user.create({
        data: {
            email,
            username: preferredUsername,
            uid,
        },
    })
}

/**
 * "Login" a user and get the CognitoUserSession or an error
 */
export const login = (email: string, password: string): Promise<AwsCognito.CognitoUserSession> => {
    const authDetails = new AwsCognito.AuthenticationDetails({
        Username: email,
        Password: password,
    })
    const userData = {
        Username: email,
        Pool: userPool,
    }
    const cognitoUser = new AwsCognito.CognitoUser(userData)

    return new Promise((resolve, reject) =>
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: (result) => {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                writeUserAttributes(cognitoUser, result.getIdToken().payload.sub).catch(() => {})

                resolve(result)
            },
            onFailure: (err) => {
                reject(new AuthenticationError(err))
            },
        }),
    )
}

export const changePassword = async (
    email: string,
    oldPassword: string,
    newPassword: string,
): Promise<void> => {
    const userData = {
        Username: email,
        Pool: userPool,
    }
    const authDetails = new AwsCognito.AuthenticationDetails({
        Username: email,
        Password: oldPassword,
    })
    const cognitoUser = new AwsCognito.CognitoUser(userData)

    await new Promise((resolve, reject) =>
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: (result) => {
                resolve(result)
            },
            onFailure: (err) => {
                reject(new AuthenticationError(err))
            },
        }),
    )

    await new Promise<void>((resolve, reject) => {
        cognitoUser.changePassword(oldPassword, newPassword, (err) => {
            // istanbul ignore next
            if (err) {
                reject(new AuthenticationError(err))
            }

            resolve()
        })
    })

    await new Promise<void>((resolve, reject) => {
        cognitoUser.globalSignOut({
            onSuccess: () => {
                resolve()
            },
            onFailure: (err) => {
                reject(new AuthenticationError(err))
            },
        })
    })
}

export default {
    changePassword,
    register,
    login,
    tokenEndpointIsValid,
    reqHasToken,
    userPool,
}
