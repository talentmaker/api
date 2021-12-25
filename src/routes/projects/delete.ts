import * as yup from "yup"
import Status from "~/statuses"
import db from "~/db"
import verifyId from "~/jwt"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    projectId: yup.number().required(),
})

export const deleteProject: ExpressHandler = async (request, response) => {
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
    } else if (project.creatorId !== user.uid) {
        return response.status(Status.Forbidden).json({
            message: "you are not allowed to delete this project",
        })
    }

    await db.participant.updateMany({
        data: {
            projectId: null,
        },
        where: {
            projectId: project.id,
        },
    })

    await db.project.delete({
        where: {
            id: body.projectId,
        },
    })

    return response.status(Status.NoContent).send()
}
