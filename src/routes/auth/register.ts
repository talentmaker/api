import * as yup from "yup"
import Status from "~/statuses"
import auth from "./internal/utils"
import {checkEmail} from "~/utils"
import {isProduction} from "~/env"

const usernameLimit = 32

const bodySchema = yup.object({
    email: yup
        .string()
        .email()
        .test("is-valid-email", async (val, ctx) => {
            if (!val) {
                return true
            }

            const emailValidation = await checkEmail(val)

            if (
                emailValidation === undefined ||
                (!isProduction && val.endsWith("@test.com")) // Disregard @test.com for testing)
            ) {
                return true
            }

            return ctx.createError({message: `Invalid email. Reason: ${emailValidation}.`})
        })
        .required(),
    password: yup.string().required(),
    username: yup.string().required().max(usernameLimit),
})

export const register: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)

    await auth.register(body.username, body.email, body.password)

    return response.status(Status.NoContent).send()
}
