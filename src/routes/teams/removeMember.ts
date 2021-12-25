import * as yup from "yup"
import Status from "~/statuses"
import db from "~/db"
import {verifyId} from "~/jwt"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    projectId: yup.number().required(),
    memberUid: yup.string().uuid().required(),
})

export const removeMember: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await verifyId(body.idToken)

    const project = await db.project.findUnique({
        where: {
            id: body.projectId,
        },
    })

    if (project === null) {
        return response.status(Status.NotFound).json({
            message: `no project with id ${body.projectId} was found`,
        })
    } else if (user.uid !== body.memberUid && project.creatorId !== user.uid) {
        return response.status(Status.Forbidden).json({
            message:
                "you can't remove anyone unless you're the owner. You can only remove yourself.",
        })
    } else if (project.creatorId === body.memberUid) {
        return response.status(Status.BadRequest).json({
            message: "the owner cannot be removed",
        })
    }

    await db.participant.update({
        data: {
            projectId: null,
        },
        where: {
            id: {
                uid: body.memberUid,
                competitionId: project.competitionId,
            },
        },
    })

    return response.status(Status.NoContent).send()
}
