import * as yup from "yup"
import Status from "~/statuses"
import auth from "./internal/utils"
import {createInfo} from "./internal/createInfo"
import {encrypt} from "@luke-zhang-04/utils/cjs/node"

const bodySchema = yup.object({
    email: yup.string().email().required(),
    password: yup.string().required(),
})

export const login: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await auth.login(body.email, body.password)

    const info = await createInfo(user)
    const refreshToken = await encrypt(
        user.getRefreshToken().getToken(),
        "aes-256-gcm",
        process.env.KEY1,
        "base64url",
    )
    const cookieConfig = {
        httpOnly: true,
        path: "/",
        sameSite: "none" as const, // Wtf apparently this is necessary
        secure: true,
    }

    return response.cookie("refreshToken", refreshToken, cookieConfig).status(Status.Ok).json(info)
}
