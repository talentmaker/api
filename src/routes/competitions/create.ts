import * as yup from "yup"
import Re2 from "re2"
import Status from "~/statuses"
import db from "~/db"
import getUser from "~/jwt"
import {pick} from "@luke-zhang-04/utils/cjs"
import purifyMarkdown from "~/utils/markdown"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    title: yup.string().nullable(),
    desc: yup.string().nullable(),
    shortDesc: yup.string().required(),
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

export const create: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await getUser(body.idToken)

    if (!user.isOrganization) {
        return response.status(Status.Forbidden).json({
            message: "Only organizations are allowed to create competitions",
        })
    }

    const competition = await db.competition.create({
        data: {
            desc: body.desc ? await purifyMarkdown(body.desc) : undefined,
            email: user.email,
            organizationId: user.uid,
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            name: body.title,
            ...pick(body, "videoURL", "website", "coverImageURL", "shortDesc"),
        },
    })

    return response.status(Status.Ok).json({
        id: competition.id,
    })
}
