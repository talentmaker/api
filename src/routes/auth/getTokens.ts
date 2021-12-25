import Status from "~/statuses"
import type {TokenRequest} from "./internal/utils"
import auth from "./internal/utils"
import {awsIdTokenSchema} from "~/schemas/auth"
import base64 from "base64-url"
import {createInfoFromTokenEndpoint} from "./internal/createInfo"
import {decrypt} from "@luke-zhang-04/utils/cjs/node"
import fetch from "node-fetch"
import {inlineTryPromise} from "@luke-zhang-04/utils/cjs"
import jwt from "jsonwebtoken"
import qs from "querystring"
import {validate} from "~/utils"

// istanbul ignore next
const getTokens = async (cookies: TokenRequest): Promise<{[key: string]: unknown}> =>
    (await (
        await fetch(`${process.env.COGNITO_URL}/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: qs.stringify({
                grant_type: "refresh_token",
                client_id: process.env.CLIENT_ID,
                refresh_token: await decrypt(
                    base64.unescape(cookies.refreshToken),
                    "aes-256-gcm",
                    process.env.KEY1,
                    "base64",
                ),
            }),
        })
    ).json()) as {[key: string]: unknown}

// istanbul ignore next
/**
 * Uses a refresh token to get an id token from the AWS Token endpoint
 */
export const getTokensFromRefreshToken: ExpressHandler = async ({cookies}, response) => {
    if (auth.reqHasToken(cookies)) {
        if (cookies.refreshToken === "") {
            return response.status(Status.BadRequest).json({
                message: "Refresh token is empty string, user was signed out",
            })
        }

        const result = await inlineTryPromise(() => getTokens(cookies))

        if (result instanceof Error) {
            return response
                .cookie("refreshToken", "", {
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                    maxAge: 0, // "delete" the cookie
                })
                .status(Status.NoContent)
                .json()
        } else if (!auth.tokenEndpointIsValid(result)) {
            return response
                .status(Status.Unauthorized)
                .cookie("refreshToken", "", {
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                    maxAge: 0, // "delete" the cookie
                })
                .json({
                    message: "The token fetched from the token endpoint is not valid",
                })
        }

        const idTokenPayload = await validate(awsIdTokenSchema, jwt.decode(result.id_token))

        if (idTokenPayload instanceof Error) {
            return response
                .status(Status.Unauthorized)
                .cookie("refreshToken", "", {
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                    maxAge: 0, // "delete" the cookie
                })
                .json({
                    message: idTokenPayload.message,
                })
        }

        const userInfo = await createInfoFromTokenEndpoint(idTokenPayload)

        return response.status(Status.Ok).json(userInfo)
    }

    return response.status(Status.Ok).json({
        message: "Missing token credentials.",
    })
}
