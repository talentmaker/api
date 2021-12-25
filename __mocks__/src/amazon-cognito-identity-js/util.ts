/**
 * Insecure way of generating a UUID
 *
 * @returns UUID
 */
export const generateUUID = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/gu, (str) => {
        const rand = (Math.random() * 16) | 0
        const v = str == "x" ? rand : (rand & 0x3) | 0x8

        return v.toString(16)
    })
