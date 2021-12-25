import * as yup from "yup"
import {checkEmail} from "~/utils"
import {isProduction} from "~/env"
import {ses} from "~/aws"
import statuses from "~/statuses"

// istanbul ignore file

const bodySchema = yup.object({
    name: yup.string().required(),
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
    subject: yup.string(),
    message: yup.string().required(),
})

export const contact: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)

    const toEmail = isProduction ? "talentmakergroup@gmail.com" : "luke_zhang_04@protonmail.com"

    await ses.sendEmail({
        Source: body.email,
        Destination: {
            ToAddresses: [toEmail],
        },
        Message: {
            Subject: {
                Charset: "UTF-8",
                Data: `Message from ${body.name}: ${body.subject}`,
            },
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: body.message,
                },
            },
        },
    })

    await ses.sendEmail({
        Source: "talentmakergroup@gmail.com",
        Destination: {
            ToAddresses: [body.email],
        },
        Message: {
            Subject: {
                Charset: "UTF-8",
                Data: "Thank you for contacting Talentmaker",
            },
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: `Dear ${body.name},\n\nThank you for contacting Talentmaker. This is an automated message to let you know that the email was sent successfully, and we'll be in touch with you shortly.\n\nRegards,\nThe Talentmaker Group.`,
                },
            },
        },
    })

    return response.status(statuses.NoContent).send()
}
