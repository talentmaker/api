import * as yup from "yup"
import getUser, {ExtendedUserInfo} from "~/jwt"
import {isDevelopment, isProduction, isTesting} from "~/env"
import type {SendEmailCommandInput} from "@aws-sdk/client-ses"
import Status from "~/statuses"
import {apiURL} from "~/globals"
import {daysToMs} from "@luke-zhang-04/dateplus/dist/cjs/dateplus.min.cjs"
import db from "~/db"
import {encodeAndSign} from "@luke-zhang-04/utils/cjs/node"
import {ses} from "~/aws"

const bodySchema = yup.object({
    idToken: yup.string().required(),
})

/**
 * Send the request email
 */
const prepareAndSend = async (
    user: ThenArg<ReturnType<typeof getUser>>,
): Promise<void | SendEmailCommandInput> => {
    // Three days in mv
    const timeToExpire = 259_200_000

    // Stringified data to send
    const data = JSON.stringify({
        uid: await encodeAndSign(user.uid, "sha384", process.env.KEY2, "base64", false),
        exp: Date.now() + timeToExpire,
        username: user.username,
        email: user.email,
        verified: user.isVerified || isDevelopment, // Just true if development mode
    })

    // Final link
    const link = `${apiURL}/organization/accept/${await encodeAndSign(
        data,
        "sha384",
        process.env.KEY3,
        "base64url",
    )}`

    // istanbul ignore next
    const config: SendEmailCommandInput = {
        Source: "talentmakergroup@gmail.com",
        Destination: {
            ToAddresses: isProduction
                ? ["talentmakergroup@gmail.com"]
                : ["luke_zhang_04@protonmail.com"],
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: `${isDevelopment ? "***THIS IS A TEST***\n" : ""}Verification for ${
                        user.username
                    }#${user.uid.slice(0, 8)}\n\nA user with the email "${
                        user.email
                    }", username "${user.username}", and id "${
                        user.uid
                    }" would like to be verified as an organization.\n\nThis user has${
                        user.isVerified ? "" : " NOT"
                    } verified their own email.\n\nMake sure you trust this user BEFORE you click the link. If you are unsure, DO NOT CLICK THE LINK. Organizations should be trustworthy and have extra privileges. \nTo verify ${
                        user.username
                    } as an organization, the following link: ${link}.\n\nThis link expires on ${new Date(
                        Date.now() + timeToExpire,
                    )}.`,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: `Confirm ${user.username} to be an organization.`,
            },
        },
    }

    // istanbul ignore else
    if (isTesting) {
        return config
    }

    // istanbul ignore next
    await ses.sendEmail(config)
}

/**
 * Checks if a user can request
 *
 * @returns 1. Void if user can request, message if they can't with the reason 2. Void if the user
 *   has request before, false if they haven't
 */
const userCanRequest = async ({
    uid,
    isOrganization,
}: ExtendedUserInfo): Promise<string | undefined> => {
    // istanbul ignore if
    if (isOrganization) {
        return "You're already an organization"
    }

    const request = await db.organizationRequest.findUnique({
        where: {
            uid,
        },
    })

    if (request === null) {
        // Hasn't made a request before
        return
    }

    const requestTimeDays = 5
    const requestTime = daysToMs(requestTimeDays)

    // Expiry in epoch time
    const expiry = request.lastRequest.getTime() + requestTime

    // istanbul ignore else
    if (Date.now() < expiry) {
        return `You have recently requested to become an organization. Please request again on ${new Date(
            expiry,
        )}`
    }

    // istanbul ignore next
    return
}

export const request: ExpressHandler = async (req, response) => {
    const body = await bodySchema.validate(req.body)
    const user = await getUser(body.idToken)

    if (!user.isVerified) {
        return response.status(Status.Forbidden).json({
            message: "Please verify your email first",
        })
    }

    const requestError = await userCanRequest(user)

    if (requestError === undefined) {
        const res = await prepareAndSend(user)

        await db.organizationRequest.upsert({
            update: {
                lastRequest: new Date(),
            },
            create: {
                uid: user.uid,
                lastRequest: new Date(),
            },
            where: {
                uid: user.uid,
            },
        })

        // isanbul ignore else
        if (isTesting) {
            return response.status(Status.Ok).json(res)
        }

        // istanbul ignore next
        return response.status(Status.Ok).json({
            message: "Successfully made request!",
        })
    }

    return response.status(Status.TooManyRequests).json({
        message: requestError,
    })
}
