/**
 * @file create Or edit (write) a project
 */

import * as yup from "yup"
import Re2 from "re2"
import Status from "~/statuses"
import db from "~/db"
import {pick} from "@luke-zhang-04/utils/cjs"
import purifyMarkdown from "~/utils/markdown"
import {userInComp} from "~/utils"
import {verifyId} from "~/jwt"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    title: yup.string().required(),
    competitionId: yup.number().required(),
    desc: yup.string().nullable(),
    srcURL: yup.string().nullable(),
    demoURL: yup.string().nullable(),
    license: yup.string().nullable(),
    videoURL: yup
        .string()
        .matches(new Re2(/youtu\.be|youtube|^$/u), "Video URL must be a youtube video")
        .url()
        .nullable()
        .optional(),
})

/**
 * Creates a new project
 */
export const create: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await verifyId(body.idToken)

    if (!(await userInComp(body.competitionId, user.uid))) {
        return response.status(Status.Forbidden).json({
            message: "User must first be part of a competition to create a project",
        })
    } else if (
        (await db.project.findUnique({
            where: {
                creatorProject: {
                    creatorId: user.uid,
                    competitionId: body.competitionId,
                },
            },
        })) !== null
    ) {
        return response.status(Status.Conflict).json({
            message: "User already has a project, and should modify their existing one",
        })
    }

    const project = await db.project.create({
        data: {
            teamMembers: {
                connect: {
                    id: {
                        uid: user.uid,
                        competitionId: body.competitionId,
                    },
                },
            },
            createdAt: new Date(),
            desc: body.desc ? await purifyMarkdown(body.desc) : undefined,
            creatorId: user.uid,
            competitionId: body.competitionId,
            name: body.title,
            topics: "",
            ...pick(body, "srcURL", "demoURL", "license", "videoURL"),
        },
    })

    await db.user.update({
        where: {
            uid: user.uid,
        },
        data: {
            lastActive: new Date(),
        },
    })

    return response.status(Status.Ok).json({
        id: project.id,
    })
}
