import * as globals from "~/globals"
import * as yup from "yup"

/**
 * The default AWS Cognito ID token payload
 */
export const awsIdTokenSchema = yup.object({
    sub: yup.string().required(),
    aud: yup.string().required(),
    email_verified: yup.boolean().required(),
    event_id: yup.string().required(),
    token_use: yup.string().matches(/id/u).required(),
    auth_time: yup.number().required(),
    iss: yup.string().required(),
    "cognito:username": yup.string().required(),
    exp: yup.number().required(),
    preferred_username: yup.string().required(),
    iat: yup.number().required(),
    email: yup.string().required(),
})

export type AwsIdTokenPayload = typeof awsIdTokenSchema.__outputType

/**
 * The custom auth token payload
 */
export const authTokenSchema = yup.object({
    iat: yup.number().required(),
    uid: yup.string().required().uuid(),
    validity: yup.string().oneOf([globals.authTokenValidity]).required(),
    isVerified: yup.boolean().required(),
})

export type AuthTokenSchema = typeof authTokenSchema.__outputType
