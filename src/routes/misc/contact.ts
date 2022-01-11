import * as yup from "yup"
import {checkEmail} from "~/utils"
import {isProduction} from "~/env"
import {lambdaSes} from "~/aws"
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

    await lambdaSes.send(
        {
            email: {
                from: "talentmakergroup@gmail.com",
                dest: {
                    to: [toEmail],
                },
                content: {
                    subject: {
                        charset: "UTF-8",
                        data: `Message from ${body.name} at ${body.email}: ${body.subject}`,
                    },
                    body: {
                        text: {
                            charset: "UTF-8",
                            data: `${body.name} | ${body.email}\n\n${body.message}`,
                        },
                    },
                },
            },
        },
        {},
        true,
    )

    await lambdaSes.send(
        {
            email: {
                from: "talentmakergroup@gmail.com",
                dest: {
                    to: [body.email],
                },
                content: {
                    subject: {
                        charset: "UTF-8",
                        data: "Thank you for contacting Talentmaker",
                    },
                    body: {
                        text: {
                            charset: "UTF-8",
                            data: `Dear ${body.name},\n\nThank you for contacting Talentmaker. This is an automated message to let you know that the email was sent successfully, and we'll be in touch with you shortly.\n\nRegards,\nThe Talentmaker Group.`,
                        },
                    },
                },
            },
        },
        {},
        true,
    )

    return response.status(statuses.NoContent).send()
}
