import * as yup from "yup"
import {
    InviteLinkDataSchema as LinkDataType,
    inviteLinkDataSchema as linkDataSchema,
} from "~/schemas"
import Status from "~/statuses"
import db from "~/db"
import {decodeAndVerify} from "@luke-zhang-04/utils/cjs/node"
import {inlineTryPromise} from "@luke-zhang-04/utils/cjs"
import {validate} from "~/utils"
import {verifyId} from "~/jwt"

const bodySchema = yup.object({
    idToken: yup.string().required(),
})

const paramsSchema = yup.object({
    data: yup.string().required(),
})

export const join: ExpressHandler = async (request, response) => {
    const [body, params] = await Promise.all([
        bodySchema.validate(request.body),
        paramsSchema.validate(request.params),
    ])

    const linkData = await inlineTryPromise(
        async () =>
            (await validate(
                linkDataSchema,
                decodeAndVerify(params.data, "sha256", process.env.KEY1, "base64url"),
            )) as LinkDataType,
    )

    // istanbul ignore next
    if (linkData instanceof Error) {
        return response.status(Status.BadRequest).json({
            message: "your invite link is invalid",
        })
    }

    const [projectId, competitionId, expiry] = linkData

    // istanbul ignore if
    if (Date.now() > expiry) {
        return response.status(Status.Gone).json({
            message: "your invite link is expired",
        })
    }

    const user = await verifyId(body.idToken)

    const currentParticipant = await db.participant.findUnique({
        select: {
            projectId: true,
        },
        where: {
            id: {
                uid: user.uid,
                competitionId,
            },
        },
    })

    if (currentParticipant === null) {
        return response.status(Status.Forbidden).json({
            message: "you're not in this competition",
        })
    } else if (
        currentParticipant.projectId !== undefined &&
        currentParticipant.projectId !== null
    ) {
        return response.status(Status.Forbidden).json({
            message:
                "you're already part of a team. Team management is coming soon https://github.com/Luke-zhang-04/talentmaker-site/projects/3",
        })
    }

    await db.participant.update({
        data: {projectId},
        where: {
            id: {
                uid: user.uid,
                competitionId,
            },
        },
    })

    return response.status(Status.NoContent).send()
}
