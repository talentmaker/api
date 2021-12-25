import * as yup from "yup"
import Status from "~/statuses"
import db from "~/db"

const paramsSchema = yup.object({
    uid: yup.string().uuid().required(),
})

const querySchema = yup.object({
    shouldFetchProjects: yup.boolean().default(false),
})

export const get: ExpressHandler = async (request, response) => {
    const [{uid}, {shouldFetchProjects}] = await Promise.all([
        paramsSchema.validate(request.params),
        querySchema.validate(request.query),
    ])

    const user = await db.user.findUnique({
        where: {
            uid,
        },
        select: {
            uid: true,
            username: true,
            email: false,
        },
        rejectOnNotFound: true,
    })

    // Fetch projects seperately to for team member select
    const projects = shouldFetchProjects
        ? await db.project.findMany({
              where: {
                  teamMembers: {
                      some: {
                          uid,
                      },
                  },
              },
              include: {
                  teamMembers: {
                      select: {
                          uid: true,
                      },
                  },
              },
          })
        : undefined

    return response.status(Status.Ok).json({...user, projects})
}
