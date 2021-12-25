import * as yup from "yup"
import Status from "~/statuses"
import db from "~/db"
import getUser from "~/jwt"
import {isOrganization} from "~/utils/auth"
import {userInComp} from "~/utils"

const bodySchema = yup.object({
    idToken: yup.string().required(),
    competitionId: yup.number().required(),
})

/**
 * Makes sure the requested competition exits, and make sure the user isn't already in the competition
 *
 * @param competitionId - Id of competition
 * @param uid - Id for user
 * @returns Return error any of the above params are not satisfied
 */
const requestIsValid = async (
    competitionId: number,
    uid: string,
): Promise<true | [err: Error, status?: number]> => {
    const hasCompetition = (await db.competition.count({where: {id: competitionId}})) > 0
    const hasParticipant = await userInComp(competitionId, uid)

    if (!hasCompetition) {
        return [new Error(`No such competition with id of ${competitionId}`), Status.NotFound]
    } else if (hasParticipant) {
        return [new Error("You're already in this competition"), Status.Ok]
    } else if (await isOrganization(uid)) {
        return [new Error("Organizations cannot join competitions"), Status.Forbidden]
    }

    return true
}

export const join: ExpressHandler = async (request, response) => {
    const body = await bodySchema.validate(request.body)
    const user = await getUser(body.idToken)

    const isValidRequest = await requestIsValid(body.competitionId, user.uid)

    // istanbul ignore next
    if (isValidRequest instanceof Array) {
        return response.status(isValidRequest[1] ?? Status.Forbidden).json({
            message: isValidRequest[0].message,
        })
    }

    await db.participant.create({
        data: {
            uid: user.uid,
            competitionId: body.competitionId,
        },
    })

    return response.status(Status.NoContent).send()
}
