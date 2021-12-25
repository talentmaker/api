import * as yup from "yup"
import Status from "~/statuses"
import auth from "./internal/utils"

const bodySchema = yup.object({
    email: yup.string().email().required(),
    oldPassword: yup.string().required(),
    newPassword: yup.string().required(),
})

export const changePassword: ExpressHandler = async (request, response) => {
    const {email, oldPassword, newPassword} = await bodySchema.validate(request.body)

    await auth.changePassword(email, oldPassword, newPassword)

    return response
        .status(Status.NoContent)
        .cookie("refreshToken", "", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 0, // "delete" the cookie
        })
        .send()
}
