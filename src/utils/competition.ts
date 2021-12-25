import db from "~/db"

export const userInComp = async (competitionId: number, uid: string): Promise<boolean> =>
    (await db.participant.count({
        where: {
            uid,
            competitionId,
        },
    })) > 0

/**
 * Checks if a user is already in a competition
 *
 * @param competitionId - Id of competition to check
 * @param uid - User ID
 */
export const userHasProject = async (competitionId: number, uid: string): Promise<boolean> =>
    (await db.participant.count({
        where: {
            uid,
            competitionId,
            NOT: {
                projectId: null,
            },
        },
    })) > 0
