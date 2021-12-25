import * as yup from "yup"
import Re2 from "re2"
import Status from "~/statuses"
import db from "~/db"
import getUser from "~/jwt"
import {pick} from "@luke-zhang-04/utils/cjs"
import purifyMarkdown from "~/utils/markdown"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    id: yup.number().required(),
    title: yup.string().nullable(),
    desc: yup.string().nullable(),
    shortDesc: yup.string(),
    videoURL: yup
        .string()
        .matches(new Re2(/youtu\.be|youtube|^$/u), "Video URL must be a youtube video")
        .url()
        .nullable()
        .optional(),
    deadline: yup.string().nullable(),
    website: yup.string().nullable(),
    coverImageURL: yup.string().nullable(),
})

export const update: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await getUser(body.idToken)

    if (
        !user.isOrganization ||
        (await db.competition.findFirst({
            where: {
                id: body.id,
                organizationId: user.uid,
            },
        })) === null
    ) {
        return response.status(Status.Forbidden).json({
            message: "You are not authorized to modify this competition",
        })
    }

    await db.competition.update({
        data: {
            desc: body.desc ? await purifyMarkdown(body.desc) : undefined,
            deadline:
                body.deadline === undefined || body.deadline === null
                    ? body.deadline
                    : new Date(body.deadline),
            name: body.title,
            ...pick(body, "videoURL", "website", "coverImageURL", "shortDesc"),
        },
        where: {
            id: body.id,
        },
    })
    return response.status(Status.NoContent).send()
}
