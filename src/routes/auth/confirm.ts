// istanbul ignore file

import * as yup from "yup"
import Status from "~/statuses"
import auth from "./internal/utils"
import {cognito} from "~/aws"
// import db from "~/db"
import {inlineTryPromise} from "@luke-zhang-04/utils/cjs"
import {verifyId} from "~/jwt"

const bodySchema = yup.object({
    idToken: yup.string(),
    email: yup.string(),
    password: yup.string(),
})

export const confirm: ExpressHandler = async (request, response) => {
    const {idToken, email, password} = await bodySchema.validate(request.body)

    if (idToken) {
        const user = await verifyId(idToken)

        if (user.isVerified) {
            return response.status(Status.Ok).json({
                message: "You've already verified your email",
            })
        }

        await cognito.resendConfirmationCode({
            ClientId: process.env.CLIENT_ID,
            Username: user.uid,
        })

        return response.status(Status.NoContent).send()
    } else if (email && password) {
        const errorOrLogin = await inlineTryPromise(() => auth.login(email, password))

        if (errorOrLogin instanceof Error) {
            if (errorOrLogin.message.includes("not confirmed")) {
                await cognito.resendConfirmationCode({
                    ClientId: process.env.CLIENT_ID,
                    Username: email, // this works too?,
                })

                return response.status(Status.NoContent).send()
            }

            return response.status(Status.Unauthorized).json({
                message: errorOrLogin.toString(),
            })
        }

        return response.status(Status.Ok).json({
            message: "You've already verified your email",
        })
    }

    return response.status(Status.BadRequest).json({
        message: "parameters not met for user confrimation",
    })
}
