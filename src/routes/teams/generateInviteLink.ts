import * as yup from "yup"
import Status from "~/statuses"
import {daysToMs} from "@luke-zhang-04/dateplus/dist/cjs/dateplus.min.cjs"
import db from "~/db"
import {encodeAndSign} from "@luke-zhang-04/utils/cjs/node"
import {verifyId} from "~/jwt"

const querySchema = yup.object({
    idToken: yup.string().required(),
    competitionId: yup.number().required(),
    projectId: yup.number().required(),
})

const isAuthorizedToInvite = async (uid: string, projectId: number): Promise<boolean> => {
    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
    })

    return project?.creatorId === uid
}

const inviteLinkExpirationDays = 1
const inviteLinkExpiration = daysToMs(inviteLinkExpirationDays)

export const generateInviteLink: ExpressHandler = async (request, response) => {
    const query = await querySchema.validate(request.query)
    const user = await verifyId(query.idToken)

    if (await isAuthorizedToInvite(user.uid, query.projectId)) {
        const expiry = Date.now() + inviteLinkExpiration

        return response.status(Status.Ok).json({
            message: "Success!",
            urlSuffix: await encodeAndSign(
                JSON.stringify([query.projectId, query.competitionId, expiry]),
                "sha256",
                process.env.KEY1,
                "base64url",
            ),
        })
    }

    return response.status(Status.Forbidden).json({
        message: "you can't invite anyone unless you're the owner",
    })
}
