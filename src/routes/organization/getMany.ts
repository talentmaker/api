import * as yup from "yup"
import Status from "~/statuses"
import {User} from "../../../.prisma"
import db from "~/db"
import {itemCap} from "~/globals"

const querySchema = yup.object({
    search: yup.string(),
})

export const getMany: ExpressHandler = async (request, response) => {
    const {search} = await querySchema.validate(request.query)

    if (search) {
        const wildcardSearch = `%${search}%`
        // Gets users from search using a combination of like, levenshtein distance, and soundex
        // prettier-ignore
        const users = await db.$queryRaw<User>/*sql*/`
            select username, uid
            from user
            where
                uid in (select organization.uid from organization) and (
                    username like ${wildcardSearch}
                    or levenshtein(cast(username as char(255)), cast(${search} as char(255)))
                        between 0 and if(length(username) > length(${search}), floor(length(username) / 3), floor(length(${search}) / 3))
                    or if(length(username) > 3, levenshtein(soundex(username), soundex(${search})), 2) between 0 and 1
                )
            order by
                username like ${wildcardSearch} desc,
                levenshtein(cast(username as char(255)), cast(${search} as char(255))) asc,
                if(length(username) > 3, levenshtein(soundex(username), soundex(${search})), 2) asc
            limit 30;`

        return response.status(Status.Ok).json(users)
    }

    const users = await db.user.findMany({
        select: {
            uid: true,
            username: true,
            email: false,
        },
        where: {
            organization: {
                isNot: null,
            },
        },
        take: itemCap,
        orderBy: {
            lastActive: "desc",
        },
    })

    return response.status(Status.Ok).json(users)
}
