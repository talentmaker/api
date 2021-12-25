/**
 * IdToken values to grant permissions
 */
export type IdTokens = {
    idToken: string
}

/**
 * Tokens should be sent with requests as it allows the validation of a user
 */
export type Tokens = IdTokens

/**
 * User info to be stored in the memory of the client
 */
export type UserInfo = Tokens & {
    // WARN: everything in this section should be considered insecure, and used only for display purposes on the client side
    email: string
    uid: string
    username: string
    isOrganization: boolean
    isVerified: boolean
}
