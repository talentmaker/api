import * as yup from "yup"
import {Competition} from "../../../.prisma"
import Status from "~/statuses"
import db from "~/db"
import {itemCap} from "~/globals"
import {omit} from "@luke-zhang-04/utils/cjs"

const querySchema = yup.object({
    sortWith: yup.string().oneOf(["deadline", "name"]),
    column: yup.string().oneOf(["organizationId"]),
    value: yup.string(),
    search: yup.string(),
})

/**
 * Gets up to 30 competitions
 */
export const getMany: ExpressHandler = async (request, response) => {
    const {search, ...query} = await querySchema.validate(request.query)

    if (search) {
        const wildcardSearch = `%${search}%`
        const descSearch = `%${search.replace(/[^A-Za-z0-9\s_\-!?]/gu, "")}%`

        const competitions = await db.$queryRaw<(Competition & {orgName: string})[]>/*sql*/ `
            select *, userSelection.orgName as orgName
            from competition
            -- Select organization name from users, works because organizationId will always point to an organization
            left join (select user.uid, username as orgName from user group by user.uid)
                as userSelection
                on (competition.organizationId = userSelection.uid)
            where
                match (competition.name, competition.shortDesc) against (${search} in natural language mode)
                or orgName like ${wildcardSearch}
                or if(length(${search}) >= 3, competition.desc like ${descSearch}, 0)
                or levenshtein(cast(orgName as char(255)), cast(${search} as char(255)))
                        between 0 and if(length(orgName) > length(${search}), floor(length(orgName) / 3), floor(length(${search}) / 3))
            order by
                match (competition.name, competition.shortDesc) against (${search} in natural language mode) desc,
                orgName like ${wildcardSearch} desc
            limit 30;
        `

        return response.status(Status.Ok).json(competitions)
    }

    const competitions = await db.competition.findMany({
        where: query.column
            ? {
                  [query.column]: query.value,
              }
            : undefined,
        // istanbul ignore next
        orderBy: query.sortWith === "name" ? {name: "asc"} : {deadline: "desc"},
        take: itemCap,
        include: {
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
    })

    return response.status(Status.Ok).json(
        competitions.map((competition) => ({
            ...omit(competition, "organization"),
            orgName: competition.organization.user.username,
        })),
    )
}
