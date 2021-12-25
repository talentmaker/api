import * as yup from "yup"
import Status from "~/statuses"
import db from "~/db"
import {decodeAndVerify} from "@luke-zhang-04/utils/cjs/node"
import {isOrganization} from "~/utils/auth"

const paramsSchema = yup.object({
    info: yup.string().required(),
})

const infoSchema = yup.object({
    uid: yup.string().required(),
    exp: yup.number().required(),
    username: yup.string().required(),
    email: yup.string().required(),
    verified: yup.boolean().required(),
})

/**
 * Converts an user to an organization
 */
export const userToOrganization: ExpressHandler = async (request, response) => {
    const params = await paramsSchema.validate(request.params)

    const data = await infoSchema.validate(
        JSON.parse(decodeAndVerify(params.info, "sha384", process.env.KEY3, "base64url")),
    )

    const uid = decodeAndVerify(data.uid, "sha384", process.env.KEY2, "base64", false)

    // istanbul ignore if
    if (Date.now() > data.exp) {
        return response.status(Status.Unauthorized).json({
            message: "URL is expired",
        })
    } else if (await isOrganization(uid)) {
        return response.status(Status.Ok).json({
            message: `User ${data.username}#${uid.slice(0, 8)} (${uid}) with email ${
                data.email
            } is already an organization.`,
        })
    }

    await db.organization.create({
        data: {
            uid,
        },
    })

    return response.status(Status.Ok).json({
        message: `Success! ${data.username}#${uid.slice(0, 8)} (${uid}) with email ${
            data.email
        } is now an organization!`,
    })
}
