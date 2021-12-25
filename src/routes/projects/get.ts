import Status from "~/statuses"
import db from "~/db"
import {omit} from "@luke-zhang-04/utils/cjs"

/**
 * Query params for getting by project id
 */
type GetById = {
    id: string | number
}

const shouldGetById = (obj: {[key: string]: unknown}): obj is GetById =>
    obj && (typeof obj?.id === "string" || typeof obj?.id === "number")

/**
 * Query params for getting by uid and competition ID
 */
type GetByUser = {
    uid: string
    competitionId: string | number
}

const shouldGetByUser = (obj: {[key: string]: unknown}): obj is GetByUser =>
    obj &&
    typeof obj?.uid === "string" &&
    (typeof obj.competitionId === "string" || typeof obj.competitionId === "number")

export const get: ExpressHandler = async ({query}, response) => {
    let prismaQuery: Parameters<typeof db.project.findFirst>[0] | undefined

    if (shouldGetById(query) && !isNaN(Number(query.id))) {
        prismaQuery = {
            where: {
                id: Number(query.id),
            },
        }
    } else if (shouldGetByUser(query) && !isNaN(Number(query.competitionId))) {
        const projectId = (
            await db.participant.findUnique({
                select: {
                    projectId: true,
                },
                where: {
                    id: {
                        uid: query.uid,
                        competitionId: Number(query.competitionId),
                    },
                },
            })
        )?.projectId

        if (projectId !== null && projectId !== undefined) {
            prismaQuery = {
                where: {
                    id: projectId,
                },
            }
        }
    } else {
        return response.status(Status.BadRequest).json({
            message: "Query missing necessary params",
        })
    }

    if (prismaQuery === undefined) {
        return response.status(Status.NotFound).json({
            message: "No such project with given params",
        })
    }

    const project = await db.project.findFirst({
        ...prismaQuery,
        include: {
            competition: {
                select: {
                    name: true,
                    organization: {
                        select: {
                            user: {
                                select: {
                                    username: true,
                                },
                            },
                        },
                    },
                },
            },
            teamMembers: {
                select: {
                    uid: true,
                    role: true,
                    desc: true,
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            },
            creatorUser: {
                select: {
                    username: true,
                },
            },
        },
        rejectOnNotFound: true,
    })

    return response.status(Status.Ok).json({
        ...omit(project, "competition", "teamMembers", "creatorUser"),
        creatorUsername: project.creatorUser.username,
        competitionOrgName: project.competition.organization.user.username,
        competitionName: project.competition.name,
        topics: project.topics?.split(" ") ?? [],
        teamMembers: project.teamMembers.map((member) => ({
            ...omit(member, "user"),
            username: member.user.username,
            isCreator: member.uid === project.creatorId,
        })),
    })
}
