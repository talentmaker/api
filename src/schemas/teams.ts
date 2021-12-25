import * as yup from "yup"

export const inviteLinkDataSchema = yup.array(yup.number().required()).required().length(3)

export type InviteLinkDataSchema = [projectId: number, competitionId: number, expiry: number]
