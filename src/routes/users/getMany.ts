import * as yup from "yup"
import RE2 from "re2"
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
        const fullTextSearch = search.replace(new RE2(/([a-zA-Z0-9])[-_]([a-zA-Z0-9])/gu), " ")
        // Gets users from search using a combination of like, levenshtein distance, and soundex
        // Leave out mysql fulltext search; not good with usernames
        // prettier-ignore
        const users = await db.$queryRaw<(Pick<User, "username" | "uid"> & {projectCount: number})[]>/*sql*/`
            select user.username, user.uid, participantSelection.projectCount
            from user
            left join (select participant.uid as participantUid, COUNT(*) as projectCount from participant where participant.projectId IS NOT NULL group by participantUid)
                as participantSelection
                on (user.uid = participantSelection.participantUid)
            where
                uid not in (select organization.uid from organization) and (
                    username like ${wildcardSearch}
                    or levenshtein(cast(username as char(255)), cast(${search} as char(255)))
                        between 0 and if(length(username) > length(${search}), floor(length(username) / 3), floor(length(${search}) / 3))
                    or match (username) against (${fullTextSearch} in boolean mode)
                    or if(length(username) > 3, levenshtein(soundex(username), soundex(${search})), 2) between 0 and 1
                )
            order by
                username like ${wildcardSearch} desc,
                levenshtein(cast(username as char(255)), cast(${search} as char(255))) asc,
                match (username) against (${fullTextSearch} in boolean mode),
                if(length(username) > 3, levenshtein(soundex(username), soundex(${search})), 2) asc
            limit 30;`

        return response.status(Status.Ok).json(
            users.map(({projectCount, ...user}) => ({
                ...user,
                projectCount: projectCount ?? 0,
            })),
        )
    }

    const users = await db.user.findMany({
        select: {
            uid: true,
            username: true,
            email: false,
            _count: {
                select: {
                    participating: true,
                },
            },
        },
        where: {
            organization: null,
        },
        take: itemCap,
        orderBy: {
            lastActive: "desc",
        },
    })

    return response.status(Status.Ok).json(
        users.map(({_count, ...user}) => ({
            ...user,
            projectCount: _count?.participating ?? 0,
        })),
    )
}
