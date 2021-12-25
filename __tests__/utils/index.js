import * as yup from "yup"
import {app} from "../.."
import crypto from "crypto"
import supertest from "supertest"

/**
 * Initializes request to Express app
 *
 * @param {any} app - Optional application to pass in. Defaults to imported express app
 * @returns {supertest.SuperTest<supertest.Test>} Supertest http tester
 */
export const request = (_app) => supertest(_app ?? app)

export const authResult = yup.object({
    idToken: yup.string().required(),
    email: yup.string().required(),
    uid: yup.string().required(),
    username: yup.string().required(),
    isOrganization: yup.boolean().required(),
})

/**
 * Gets the tokens and authentication details of a user
 *
 * @param {{email: string; password: string}} params - Email and password of user
 * @returns User info
 */
export const login = async (params) => {
    const {body} = await request().post("/auth/login").send(params).expect(200)

    return await authResult.validate(body, {strict: true})
}

/**
 * Insecure way of generating a UUID
 *
 * @returns UUID
 */
export const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/gu, (str) => {
        const rand = crypto.randomInt(16)
        const v = str === "x" ? rand : (rand & 0x3) | 0x8

        return v.toString(16)
    })
