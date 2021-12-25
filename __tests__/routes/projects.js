import * as yup from "yup"
import {request, login} from "../utils"
import {detailedCompetitionSchema} from "./competitions"
import qs from "query-string"

export const projectSchema = yup.object({
    id: yup.number().required(),
    creatorId: yup.string().uuid().required(),
    createdAt: yup.date().required(),
    desc: yup.string().nullable(),
    srcURL: yup.string().nullable(),
    demoURL: yup.string().nullable(),
    license: yup.string().nullable(),
    videoURL: yup.string().nullable(),
    coverImageURL: yup.string().nullable(),
    competitionId: yup.number(),
    name: yup.string().nullable(),
    topics: yup.array().nullable(),
    teamMembers: yup
        .array(
            yup.object({
                uid: yup.string().required(),
            }),
        )
        .required(),
})

const projectsSchema = yup.array(projectSchema).required()

describe("Test projects", () => {
    /**
     * @type {import("../utils/types").User}
     */
    let user1

    /**
     * @type {import("../utils/types").User}
     */
    let user6

    /**
     * @type {import("../utils/types").User}
     */
    let user7

    beforeAll(async () => {
        user1 = await login({
            email: "test@test.com",
            password: "abc123",
        })

        user6 = await login({
            email: "test6@test.com",
            password: "abc123",
        })

        user7 = await login({
            email: "test7@test.com",
            password: "abc123",
        })
    })

    describe("Create", () => {
        it("should validate write params", async () => {
            const {body} = await request()
                .post("/projects/write")
                .send({
                    idToken: user1.idToken,
                })
                .expect(400)

            expect(body.message).toContain("ValidationError:")
        })

        it("should not write if not in competition", async () => {
            const {body} = await request()
                .post("/projects/write")
                .send({
                    idToken: user1.idToken,
                    title: "new submission",
                    competitionId: 2,
                })
                .expect(403)

            expect(body.message).toContain("must first be part of a competition")
        })

        it("should write properly", async () => {
            await request()
                .post("/projects/write")
                .send({
                    idToken: user1.idToken,
                    title: "new submission",
                    competitionId: 1,
                })
                .expect(200)
        })
    })

    describe("Read", () => {
        it("should get all projects for a competition", async () => {
            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/getMany",
                        query: {column: "competitionId", value: 1},
                    }),
                )
                .send()
                .expect(200)

            expect(body.length).toBe(1)

            await projectsSchema.validate(body)

            const {body: body2} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/getMany",
                        query: {column: "competitionId", value: 2},
                    }),
                )
                .send()
                .expect(200)

            expect(body2.length).toBe(0)
        })

        it("should validate get params", async () => {
            const {body} = await request().get("/projects/get").send().expect(400)

            expect(body.message).toBe("Query missing necessary params")
        })

        it("should get 1 project by project id", async () => {
            const {body} = await request()
                .get(qs.stringifyUrl({url: "/projects/get", query: {id: 1}}))
                .send()
                .expect(200)

            await projectSchema.validate(body)

            expect(body.id).toBe(1)
        })

        it("should fail on unknown id", async () => {
            await request()
                .get(qs.stringifyUrl({url: "/projects/get", query: {id: 100}}))
                .send()
                .expect(404)
        })

        it("should get 1 project by user id and competition id", async () => {
            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/get",
                        query: {uid: user1.uid, competitionId: 1},
                    }),
                )
                .send()
                .expect(200)

            await projectSchema.validate(body)

            expect(body.id).toBe(1)
        })

        it("should fail if user has no project", async () => {
            await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/get",
                        query: {uid: user1.uid, competitionId: 2},
                    }),
                )
                .send()
                .expect(404)
        })
    })

    describe("Update", () => {
        it("should prevent unauthorized editing", async () => {
            const user2 = await login({
                email: "test2@test.com",
                password: "abc123",
            })

            const {body} = await request()
                .put("/projects/write")
                .send({
                    idToken: user2.idToken,
                    projectId: 1,
                    desc: "add desc",
                })
                .expect(403)

            expect(body.message).toContain("not authorized")
        })

        it("should edit properly", async () => {
            await request()
                .put("/projects/write")
                .send({
                    idToken: user1.idToken,
                    projectId: 1,
                    desc: "add desc <script>alert(0)</script>",
                })
                .expect(204)

            const {body} = await request()
                .get(qs.stringifyUrl({url: "/projects/get", query: {id: 1}}))
                .send()
                .expect(200)

            await projectSchema.validate(body)

            expect(body.desc.trim()).toBe("add desc")

            const {body: body2} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/competitions/get",
                        query: {
                            id: 1,
                            uid: user1.uid,
                        },
                    }),
                )
                .send()
                .expect(200)

            const data = await detailedCompetitionSchema.validate(body2)

            expect(data.id).toBe(1)
            expect(data.name).toBe("Web development competition for Talentmaker")
            expect(data.hasProject).toBe(true)
        })
    })

    describe("Delete", () => {
        /**
         * @type {projectSchema["__outputType"]}
         */
        let project

        beforeAll(async () => {
            await request()
                .post("/competitions/join")
                .send({
                    idToken: user6.idToken,
                    competitionId: 1,
                })
                .expect(204)

            await request()
                .post("/projects/write")
                .send({
                    idToken: user6.idToken,
                    title: "new submission",
                    competitionId: 1,
                })
                .expect(200)

            project = (
                await request()
                    .get(
                        qs.stringifyUrl({
                            url: "/projects/get",
                            query: {uid: user6.uid, competitionId: 1},
                        }),
                    )
                    .send()
                    .expect(200)
            ).body

            const {
                body: {urlSuffix: inviteLink},
            } = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/teams/getLink",
                        query: {
                            idToken: user6.idToken,
                            competitionId: project.competitionId,
                            projectId: project.id,
                        },
                    }),
                )
                .send()
                .expect(200)

            await request()
                .post("/competitions/join")
                .send({
                    idToken: user7.idToken,
                    competitionId: 1,
                })
                .expect(204)

            await request()
                .post(`/teams/join/${inviteLink}`)
                .send({
                    idToken: user7.idToken,
                })
                .expect(204)
        })

        it("should fail on non existent project", async () => {
            const {body} = await request()
                .del(`/projects/write`)
                .send({
                    idToken: user6.idToken,
                    projectId: 999,
                })
                .expect(404)

            expect(body.message).toContain("no project with id")
        })

        it("should only allow owner to delete", async () => {
            const {body} = await request()
                .del(`/projects/write`)
                .send({
                    idToken: user7.idToken,
                    projectId: project.id,
                })
                .expect(403)

            expect(body.message).toBe("you are not allowed to delete this project")
        })

        it("should delete project", async () => {
            await request()
                .del(`/projects/write`)
                .send({
                    idToken: user6.idToken,
                    projectId: project.id,
                })
                .expect(204)

            await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/get",
                        query: {uid: user6.uid, competitionId: 1},
                    }),
                )
                .send()
                .expect(404)
        })
    })
})
