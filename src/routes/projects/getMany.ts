import * as yup from "yup"
import Status from "~/statuses"
import db from "~/db"
import {itemCap} from "~/globals"

const querySchema = yup.object({
    column: yup.string().required().oneOf(["id", "creatorId", "competitionId", "teamMember"]),
    value: yup.string().required(),
    sortBy: yup.string().oneOf(["id", "creatorId", "createdAt", "name"]).default("id"),
    desc: yup.boolean(),
})

export const getMany: ExpressHandler = async (request, response) => {
    const query = await querySchema.validate(request.query)
    const isNumberColumn = query.column === "id" || query.column === "competitionId"
    const castedValue = isNumberColumn ? Number(query.value) : query.value

    if (isNumberColumn && isNaN(castedValue as number)) {
        return response.status(Status.BadRequest).json({
            message: "Column value must be a number",
        })
    }

    if (query.column === "teamMember") {
        const projects = await db.project.findMany({
            where: {
                teamMembers: {
                    some: {
                        uid: query.value,
                    },
                },
            },
            take: itemCap,
            // istabul ignore next
            orderBy: query.sortBy
                ? {
                      [query.sortBy]: query.desc ? "desc" : "asc",
                  }
                : undefined,
            include: {
                teamMembers: {
                    select: {
                        uid: true,
                    },
                },
            },
        })

        return response.status(Status.Ok).json(projects)
    }

    const projects = await db.project.findMany({
        where: {
            [query.column]: castedValue,
        },
        take: itemCap,
        // istabul ignore next
        orderBy: query.sortBy
            ? {
                  [query.sortBy]: query.desc ? "desc" : "asc",
              }
            : undefined,
        include: {
            teamMembers: {
                select: {
                    uid: true,
                },
            },
        },
    })

    return response.status(Status.Ok).json(projects)
}
