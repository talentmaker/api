import * as yup from "yup"
import {userHasProject, userInComp} from "~/utils"
import Status from "~/statuses"
import db from "~/db"
import {omit} from "@luke-zhang-04/utils/cjs"

const querySchema = yup.object({
    id: yup.number().required(),
    uid: yup.string().optional(),
})

/**
 * Get's a single competition and it's details
 */
export const get: ExpressHandler = async (request, response) => {
    const {uid, ...query} = await querySchema.validate(request.query)

    const isInComp = uid ? await userInComp(query.id, uid) : false
    const hasProject = uid ? await userHasProject(query.id, uid) : false
    const competition = await db.competition.findUnique({
        where: {
            id: query.id,
        },
        include: {
            organization: {
                include: {
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            },
        },
        rejectOnNotFound: true,
    })

    return response.status(Status.Ok).json({
        ...omit(competition, "organization"),
        orgName: competition.organization.user.username,
        inComp: isInComp,
        hasProject,
        topics: competition.topics?.split?.(" ") ?? [],
    })
}
