import * as yup from "yup"
import {request, login} from "../utils"

export const publicDbUserSchema = yup.object({
    uid: yup.string().required(),
    username: yup.string().required(),
})

export const bulkUserSchema = yup.array(publicDbUserSchema)

describe("Test organizations", () => {
    /**
     * @type {typeof import("../utils").authResult["__outputType"]}
     */
    let user3

    /**
     * @type {typeof import("../utils").authResult["__outputType"]}
     */
    let user4

    beforeAll(async () => {
        user3 = await login({
            email: "test3@test.com",
            password: "abc123",
        })

        user4 = await login({
            email: "test4@test.com",
            password: "abc123",
        })
    })

    /**
     * @type {string | undefined}
     */
    let url

    /**
     * @type {string | undefined}
     */
    let url2

    describe("Request", () => {
        it("should validate request", async () => {
            const {body} = await request().post("/organization/request").send({}).expect(400)

            expect(body.message).toContain("ValidationError")
        })

        it("should fail on bad token", async () => {
            const {body} = await request()
                .post("/organization/request")
                .send({
                    idToken: user3.idToken + "AAAAAA",
                })
                .expect(403)

            expect(body.message).toContain("AuthenticationError")
        })

        it("should properly make request", async () => {
            const {body} = await request()
                .post("/organization/request")
                .send({
                    idToken: user3.idToken,
                })
                .expect(200)

            /**
             * @type {string}
             */
            const text = body?.email?.content?.body?.text?.data

            expect(text).toContain("would like to be verified as an organization")

            url = text
                .match(/http:\/\/([A-z]|:|[0-9]|\/|\?|=|-|_)*/gu)[0]
                ?.slice("http://localhost:3333/organization/accept/".length)

            expect(typeof url).toBe("string")

            // Register another organization
            const {body: body2} = await request()
                .post("/organization/request")
                .send({
                    idToken: user4.idToken,
                })
                .expect(200)

            url2 = body2?.email?.content?.body?.text?.data
                .match(/http:\/\/([A-z]|:|[0-9]|\/|\?|=|-|_)*/gu)[0]
                ?.slice("http://localhost:3333/organization/accept/".length)
        })

        it("should disallow another request", async () => {
            const {body} = await request()
                .post("/organization/request")
                .send({
                    idToken: user3.idToken,
                })
                .expect(429)

            expect(body.message).toContain("Please request again")
        })
    })

    describe("Accept", () => {
        it("should fail on bad signature", async () => {
            const {body} = await request().get(`/organization/accept/bad${url}`).send().expect(403)

            expect(body.message).toContain("failed integrity check")
        })

        it("should fail on bad data", async () => {
            const {body} = await request()
                .get(`/organization/accept/${url}messedUpBase64`)
                .send()
                .expect(403)

            expect(body.message).toContain("failed integrity check")
        })

        it("should make user an organization", async () => {
            const {body} = await request().get(`/organization/accept/${url}`).send().expect(200)

            expect(body.message).toContain("Success! test user 3")

            user3 = await login({
                email: "test3@test.com",
                password: "abc123",
            })

            expect(user3.isOrganization).toBe(true)

            await request().get(`/organization/accept/${url2}`).send().expect(200)
        })

        it("should respond with error if user is already an organization", async () => {
            const {body} = await request().get(`/organization/accept/${url}`).send().expect(200)

            expect(body.message).toContain("already an organization")
        })
    })

    describe("Read", () => {
        it("should get organizations", async () => {
            const {body: organizations} = await request()
                .get(`/organization/getMany`)
                .send()
                .expect(200)

            await bulkUserSchema.validate(organizations)
        })

        it("should get organizations by search", async () => {
            const {body: organizations} = await request()
                .get(`/organization/getMany?search=test user 4`)
                .send()
                .expect(200)

            await bulkUserSchema.validate(organizations)

            expect(organizations[0].username).toBe("test user 4")
        })
    })
})
