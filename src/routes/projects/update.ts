/**
 * @file create Or edit (write) a project
 */

import * as yup from "yup"
import type {Project} from "~/../.prisma"
import Re2 from "re2"
import Status from "~/statuses"
import db from "~/db"
import {pick} from "@luke-zhang-04/utils/cjs"
import purifyMarkdown from "~/utils/markdown"
import {verifyId} from "~/jwt"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    title: yup.string(),
    projectId: yup.number(),
    competitionId: yup.number(),
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

const isAuthorizedToWrite = async (project: Project, uid: string): Promise<boolean> => {
    if (project.creatorId === uid) {
        return true
    }

    // Check if team member
    const participant = await db.participant.findUnique({
        select: {
            projectId: true,
        },
        where: {
            id: {
                uid,
                competitionId: project.competitionId,
            },
        },
    })

    return participant?.projectId === project.id
}

/**
 * Creates a new project
 */
export const update: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await verifyId(body.idToken)

    if (body.competitionId === undefined && body.projectId === undefined) {
        return response.status(Status.BadRequest).json({
            message: "Either competition ID or project ID must be specified",
        })
    }

    const project =
        body.projectId === undefined
            ? await db.project.findFirst({
                  where: {
                      competitionId: body.competitionId,
                      teamMembers: {
                          some: {
                              uid: user.uid,
                          },
                      },
                  },
              })
            : await db.project.findUnique({
                  where: {id: body.projectId},
              })

    if (project === null) {
        return response.status(Status.NotFound).json({
            message: `No project with params exists`,
        })
    } else if (
        body.projectId !== undefined && // Avoid redundant check with competitionId
        !(await isAuthorizedToWrite(project, user.uid))
    ) {
        return response.status(Status.Forbidden).json({
            message: `You are not authorized to modify this project`,
        })
    }

    await db.project.update({
        data: {
            desc: body.desc ? await purifyMarkdown(body.desc) : undefined,
            name: body.title,
            ...pick(body, "srcURL", "demoURL", "license", "videoURL"),
        },
        where: {id: project.id},
    })

    return response.status(Status.NoContent).send()
}
