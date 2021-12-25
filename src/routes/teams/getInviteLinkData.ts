import * as yup from "yup"
import {
    InviteLinkDataSchema as LinkDataSchema,
    inviteLinkDataSchema as linkDataSchema,
} from "~/schemas"
import Status from "~/statuses"
import db from "~/db"
import {decodeAndVerify} from "@luke-zhang-04/utils/cjs/node"
import {inlineTryPromise} from "@luke-zhang-04/utils/cjs"
import {validate} from "~/utils"

const paramsSchema = yup.object({
    data: yup.string().required(),
})

export const getInviteLinkData: ExpressHandler = async (request, response) => {
    const params = await paramsSchema.validate(request.params)
    const linkData = await inlineTryPromise(
        async () =>
            (await validate(
                linkDataSchema,
                decodeAndVerify(params.data, "sha256", process.env.KEY1, "base64url"),
            )) as LinkDataSchema,
    )

    // istanbul ignore next
    if (linkData instanceof Error) {
        return response.status(Status.BadRequest).json({
            message: "your invite link is invalid",
        })
    }

    const [projectId, , expiry] = linkData

    const project = await db.project.findUnique({
        select: {
            name: true,
            creatorUser: {
                select: {
                    username: true,
                },
            },
            competition: {
                select: {
                    id: true,
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
        },
        where: {
            id: projectId,
        },
        rejectOnNotFound: true,
    })

    const {competition} = project

    return response.status(Status.Ok).json({
        projectId,
        competitionId: competition.id,
        expiry,
        projectName: project.name,
        projectCreator: project.creatorUser.username,
        competitionName: competition.name ?? "Competition with no name",
        competitionCreator: competition.organization.user.username,
    })
}
