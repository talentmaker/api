/**
 * @file global Variables that will be used across many files
 */

import {hash} from "@luke-zhang-04/utils/cjs/node"
import {isProduction} from "./env"

// istanbul ignore next
export const apiURL = isProduction
    ? "https://g5a50u6z60.execute-api.us-east-1.amazonaws.com/prod"
    : "http://localhost:3333"

export const authTokenValidity = hash(
    `${apiURL}${process.env.CLIENT_ID}${process.env.COGNITO_URL}${process.env.USER_POOL_ID}id`,
    "sha256",
    "base64",
)

export const itemCap = 30

export default {
    apiURL,
    authTokenValidity,
    itemCap,
}
