import * as yup from "yup"
import {request, login} from "../utils"
import qs from "query-string"

export const competitionSchema = yup.object({
    id: yup.number().required(),
    name: yup.string().nullable(),
    desc: yup.string().nullable(),
    videoURL: yup.string().nullable(),
    deadline: yup.date().nullable(),
    website: yup.string().nullable(),
    email: yup.string().nullable(),
    organizationId: yup.string().required(),
    coverImageURL: yup.string().nullable(),
})

export const detailedCompetitionSchema = competitionSchema.shape({
    inComp: yup.boolean().required(),
    orgName: yup.string().required(),
    topics: yup.array(yup.string()),
    hasProject: yup.boolean().required(),
})

const competitionsSchema = yup.array(competitionSchema).required()

describe("Test competitions", () => {
    /**
     * @type {import("../utils/types").User}
     */
    let user3

    /**
     * @type {import("../utils/types").User}
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

    describe("Create", () => {
        it("should validate create params", async () => {
            const {body} = await request()
                .post("/competitions/write")
                .send({
                    idToken: user3.idToken,
                })
                .expect(400)

            expect(body.message).toContain("ValidationError")

            const {body: body2} = await request()
                .post("/competitions/write")
                .send({
                    title: "competition1",
                    idToken: user3.idToken,
                    shortDesc: "perhaps",
                    videoURL: "notAUrl",
                })
                .expect(400)

            expect(body2.message).toContain("ValidationError")
        })

        it("should reject non-organizations", async () => {
            const user2 = await login({
                email: "test@test.com",
                password: "abc123",
            })

            const {body: body2} = await request()
                .post("/competitions/write")
                .send({
                    idToken: user2.idToken,
                    id: "new",
                    shortDesc: "perhaps",
                })
                .expect(403)

            expect(body2.message).toContain("Only organizations")
        })

        it("should properly create", async () => {
            await request()
                .post("/competitions/write")
                .send({
                    title: "Web development competition for Talentmaker",
                    idToken: user3.idToken,
                    shortDesc: "Create a website for Talentmaker",
                })
                .expect(200)

            await request()
                .post("/competitions/write")
                .send({
                    idToken: user3.idToken,
                    shortDesc: "Nothing to say",
                    desc: "Additional keywords in description <script>alert(1)</script>",
                })
                .expect(200)

            await request()
                .post("/competitions/write")
                .send({
                    title: "Full stack application for another company",
                    idToken: user4.idToken,
                    shortDesc:
                        "Create a full stack application using a PaaS of your choice for another company",
                })
                .expect(200)
        })
    })

    describe("Read", () => {
        it("should get all competitions", async () => {
            const {body} = await request().get("/competitions/getMany").send().expect(200)

            expect(body.length).toBe(3)

            await competitionsSchema.validate(body)
        })

        it("should get all competitions by organization", async () => {
            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/competitions/getMany",
                        query: {column: "organizationId", value: user3.uid},
                    }),
                )
                .send()
                .expect(200)

            expect(body.length).toBe(2)

            await competitionsSchema.validate(body)
        })

        it("should get all competitions by search", async () => {
            const {body} = await request()
                .get(qs.stringifyUrl({url: "/competitions/getMany", query: {search: "web dev"}}))
                .expect(200)

            expect(body[0].id).toBe(1)
            expect(body[0].name).toBe("Web development competition for Talentmaker")

            const {body: body2} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/competitions/getMany",
                        query: {search: "full stack competition"},
                    }),
                )
                .expect(200)

            expect(body2[0].id).toBe(3)
            expect(body2[1].id).toBe(1)
            expect(body2[0].name).toBe("Full stack application for another company")
            expect(body2[1].name).toBe("Web development competition for Talentmaker")

            const {body: body3} = await request()
                .get(qs.stringifyUrl({url: "/competitions/getMany", query: {search: "nothing"}}))
                .expect(200)

            expect(body3[0].id).toBe(2)
            expect(body3[0].desc.trim()).toBe("Additional keywords in description")

            const {body: body4} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/competitions/getMany",
                        query: {search: "test user 4"},
                    }),
                )
                .expect(200)

            expect(body4[0].orgName).toBe("test user 4")
        })

        it("should get 1 competition", async () => {
            const {body} = await request()
                .get(qs.stringifyUrl({url: "/competitions/get", query: {id: 1}}))
                .send()
                .expect(200)

            const data = await detailedCompetitionSchema.validate(body)

            expect(data.id).toBe(1)
            expect(data.name).toBe("Web development competition for Talentmaker")
        })

        it("should fail on unknown id", async () => {
            const {body} = await request()
                .get(qs.stringifyUrl({url: "/competitions/get", query: {id: 100}}))
                .send()
                .expect(404)

            expect(body.message).toContain("No Competition found")
        })
    })

    describe("Update", () => {
        it("should prevent unauthorized editing", async () => {
            const user2 = await login({
                email: "test4@test.com",
                password: "abc123",
            })

            const {body} = await request()
                .put("/competitions/write")
                .send({
                    idToken: user2.idToken,
                    id: 1,
                    desc: "something",
                    shortDesc: "perhaps",
                })
                .expect(403)

            expect(body.message).toContain("not authorized to modify")
        })

        it("should edit competition", async () => {
            await request()
                .put("/competitions/write")
                .send({
                    idToken: user3.idToken,
                    id: 1,
                    desc: "something\n<script></script>", // Test XSS protection
                })
                .expect(204)

            const {body: body2} = await request()
                .get(qs.stringifyUrl({url: "/competitions/get", query: {id: 1}}))
                .send()
                .expect(200)

            const data = await competitionSchema.validate(body2)

            expect(data.desc?.trim()).toBe("something")
        })
    })

    describe("Join", () => {
        it("should validate request body", async () => {
            const {body} = await request()
                .post("/competitions/join")
                .send({
                    idToken: user3.idToken,
                })
                .expect(400)

            expect(body.message).toContain("ValidationError")
        })

        it("should disallow organizations from joining", async () => {
            const {body} = await request()
                .post("/competitions/join")
                .send({
                    idToken: user3.idToken,
                    competitionId: 1,
                })
                .expect(403)

            expect(body.message).toBe("Organizations cannot join competitions")
        })

        it("should fail on non-existent competition", async () => {
            const {body} = await request()
                .post("/competitions/join")
                .send({
                    idToken: user3.idToken,
                    competitionId: 100,
                })
                .expect(404)

            expect(body.message).toContain("No such competition")
        })

        it("should join a competition", async () => {
            const user2 = await login({
                email: "test@test.com",
                password: "abc123",
            })

            await request()
                .post("/competitions/join")
                .send({
                    idToken: user2.idToken,
                    competitionId: 1,
                })
                .expect(204)
        })

        it("should prevent joining again", async () => {
            const user2 = await login({
                email: "test@test.com",
                password: "abc123",
            })
            const {body} = await request()
                .post("/competitions/join")
                .send({
                    idToken: user2.idToken,
                    competitionId: 1,
                })
                .expect(200)

            expect(body.message).toBe("You're already in this competition")
        })
    })

    describe("Post joining", () => {
        it("should show that user is in the competition", async () => {
            const user2 = await login({
                email: "test@test.com",
                password: "abc123",
            })

            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/competitions/get",
                        query: {
                            id: 1,
                            uid: user2.uid,
                        },
                    }),
                )
                .send()
                .expect(200)

            const data = await detailedCompetitionSchema.validate(body)

            expect(data.id).toBe(1)
            expect(data.name).toBe("Web development competition for Talentmaker")
            expect(data.inComp).toBe(true)
        })
    })
})
