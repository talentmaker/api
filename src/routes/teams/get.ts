import Status from "~/statuses"
import db from "~/db"
import {omit} from "@luke-zhang-04/utils/cjs"

type GetByProjectId = {
    projectId: string | number
}

const shouldGetByProjectId = (obj: {[key: string]: unknown}): obj is GetByProjectId =>
    obj &&
    (typeof obj.projectId === "string" || typeof obj.projectId === "number") &&
    !isNaN(Number(obj.projectId))

type GetByUser = {
    uid: string
    competitionId: string | number
}

const shouldGetByUser = (obj: {[key: string]: unknown}): obj is GetByUser =>
    obj &&
    typeof obj.uid === "string" &&
    typeof obj.competitionId === "string" &&
    !isNaN(Number(obj.competitionId))

export const get: ExpressHandler = async ({query}, response) => {
    let projectId: number | undefined = undefined

    if (shouldGetByProjectId(query)) {
        projectId = Number(query.projectId)
    } else if (shouldGetByUser(query)) {
        const participant = await db.participant.findUnique({
            where: {
                id: {
                    uid: query.uid,
                    competitionId: Number(query.competitionId),
                },
            },
        })

        if (participant?.projectId) {
            ;({projectId} = participant)
        }
    } else {
        return response.status(Status.BadRequest).json({
            message: "query missing params",
        })
    }

    // istanbul ignore next
    if (projectId === undefined) {
        return response.status(Status.BadRequest).json({
            message: "could not find project",
        })
    }

    const teamMembers = await db.participant.findMany({
        where: {
            projectId,
        },
    })

    return response.status(Status.Ok).json({
        members: teamMembers.map((member) => omit(member)),
    })
}
