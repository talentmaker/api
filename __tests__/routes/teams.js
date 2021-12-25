import {request, login} from "../utils"
import {projectSchema} from "./projects"
import qs from "query-string"

describe("Test teams", () => {
    /**
     * Project creator
     *
     * @type {import("../utils/types").User}
     */
    let user1
    /**
     * Team member
     *
     * @type {import("../utils/types").User}
     */
    let user2
    /**
     * Not a team member
     *
     * @type {import("../utils/types").User}
     */
    let user5
    /**
     * Not a team member gets removed
     *
     * @type {import("../utils/types").User}
     */
    let user8

    /**
     * @type {string}
     */
    let inviteLinkSuffix

    /**
     * @type {projectSchema["__outputType"]}
     */
    let project

    beforeAll(async () => {
        user1 = await login({
            email: "test@test.com",
            password: "abc123",
        })

        user2 = await login({
            email: "test2@test.com",
            password: "abc123",
        })

        user5 = await login({
            email: "test5@test.com",
            password: "abc123",
        })

        user8 = await login({
            email: "test8@test.com",
            password: "abc123",
        })

        await request()
            .post("/competitions/join")
            .send({
                idToken: user5.idToken,
                competitionId: 1,
            })
            .expect(204)
    })

    describe("Invites", () => {
        beforeAll(async () => {
            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/get",
                        query: {uid: user1.uid, competitionId: 1},
                    }),
                )
                .send()
                .expect(200)

            project = await projectSchema.validate(body)
        })

        it("should validate invite query", async () => {
            const {body} = await request().get(`/teams/getLink`).send().expect(400)

            expect(body.message).toContain("ValidationError")
        })

        it("should not generate link if user doesn't own project", async () => {
            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/teams/getLink",
                        query: {
                            idToken: user2.idToken,
                            competitionId: project.competitionId,
                            projectId: project.id,
                        },
                    }),
                )
                .send()
                .expect(403)

            expect(body.message).toContain("you can't invite anyone")
        })

        it("should generate an invite link", async () => {
            const {body} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/teams/getLink",
                        query: {
                            idToken: user1.idToken,
                            competitionId: project.competitionId,
                            projectId: project.id,
                        },
                    }),
                )
                .send()
                .expect(200)

            expect(typeof body.urlSuffix).toBe("string")

            inviteLinkSuffix = body.urlSuffix
        })
    })

    describe("Link Data", () => {
        it("should fail on bad params", async () => {
            const {body} = await request().get(`/teams/getLinkData/bruh`).send().expect(400)

            expect(body.message).toContain("invite link is invalid")
        })

        it("should get link data", async () => {
            const {body} = await request()
                .get(`/teams/getLinkData/${inviteLinkSuffix}`)
                .send()
                .expect(200)

            expect(body.competitionId).toBe(project.competitionId)
            expect(body.projectId).toBe(project.id)
            expect(body.projectCreator).toBe("test user")
            expect(body.competitionCreator).toBe("test user 3")
        })
    })

    describe("Join", () => {
        it("should reject modified data", async () => {
            const {body} = await request()
                .post(`/teams/join/bad${inviteLinkSuffix}`)
                .send({
                    idToken: user2.idToken,
                })
                .expect(400)

            expect(body.message).toContain("invite link is invalid")

            const {body: body2} = await request()
                .post(`/teams/join/${inviteLinkSuffix}bad`)
                .send({
                    idToken: user2.idToken,
                })
                .expect(400)

            expect(body2.message).toContain("invite link is invalid")
        })

        it("should check if a user is in a competition", async () => {
            const {body} = await request()
                .post(`/teams/join/${inviteLinkSuffix}`)
                .send({
                    idToken: user2.idToken,
                })
                .expect(403)

            expect(body.message).toContain("not in this competition")
        })

        it("should join team", async () => {
            await request()
                .post("/competitions/join")
                .send({
                    idToken: user2.idToken,
                    competitionId: 1,
                })
                .expect(204)

            await request()
                .post(`/teams/join/${inviteLinkSuffix}`)
                .send({
                    idToken: user2.idToken,
                })
                .expect(204)

            await request()
                .post("/competitions/join")
                .send({
                    idToken: user8.idToken,
                    competitionId: 1,
                })
                .expect(204)

            await request()
                .post(`/teams/join/${inviteLinkSuffix}`)
                .send({
                    idToken: user8.idToken,
                })
                .expect(204)

            const {body: newProject} = await request().get(`/projects/get?id=${project.id}`)

            expect(
                newProject.teamMembers.find((member) => member.uid === user2.uid)?.isCreator,
            ).toBe(false)
            expect(
                newProject.teamMembers.find((member) => member.uid === user8.uid)?.isCreator,
            ).toBe(false)
            expect(
                newProject.teamMembers.find((member) => member.uid === user1.uid)?.isCreator,
            ).toBe(true)
        })

        it("should not join if user already has a project", async () => {
            await request()
                .post("/projects/write")
                .send({
                    idToken: user5.idToken,
                    title: "new submission",
                    competitionId: 1,
                })
                .expect(200)

            const {body} = await request()
                .post(`/teams/join/${inviteLinkSuffix}`)
                .send({
                    idToken: user5.idToken,
                })
                .expect(403)

            expect(body.message).toContain("already part of a team")
        })
    })

    describe("Collaboration", () => {
        it("should allow team member to edit project", async () => {
            await request()
                .put("/projects/write")
                .send({
                    idToken: user2.idToken,
                    competitionId: 1,
                    desc: "team member change",
                })
                .expect(204)

            const {body} = await request()
                .get(qs.stringifyUrl({url: "/projects/get", query: {id: 1}}))
                .send()
                .expect(200)

            await projectSchema.validate(body)

            expect(body.desc).toBe("team member change")
        })

        it("should dissallow non team members from editing the project", async () => {
            /**
             * @type {{body: projectSchema["__outputType"]}}
             */
            const {body: project} = await request()
                .get(
                    qs.stringifyUrl({
                        url: "/projects/get",
                        query: {uid: user1.uid, competitionId: 1},
                    }),
                )
                .send()
                .expect(200)

            const {body} = await request()
                .put("/projects/write")
                .send({
                    idToken: user5.idToken,
                    projectId: project.id,
                    desc: "team member change",
                })
                .expect(403)

            expect(body.message).toContain("not authorized to modify")
        })
    })

    describe("Read", () => {
        it("should validate getOne params", async () => {
            const {body} = await request().get("/teams/get").expect(400)

            expect(body.message).toContain("query missing params")
        })

        it("should get by project id", async () => {
            const {body} = await request().get(
                qs.stringifyUrl({
                    url: "/teams/get",
                    query: {
                        projectId: 1,
                    },
                }),
            )

            expect(body.members).toBeInstanceOf(Array)
            expect(body.members.length).toBe(3)
            expect(body.members.find((member) => member.uid === user1.uid)).toBeDefined()
            expect(body.members.find((member) => member.uid === user2.uid)).toBeDefined()
        })

        it("should get by competition id and user", async () => {
            const {body} = await request().get(
                qs.stringifyUrl({
                    url: "/teams/get",
                    query: {
                        competitionId: 1,
                        uid: user2.uid,
                    },
                }),
            )

            expect(body.members).toBeInstanceOf(Array)
            expect(body.members.length).toBe(3)
            expect(body.members.find((member) => member.uid === user1.uid)).toBeDefined()
            expect(body.members.find((member) => member.uid === user2.uid)).toBeDefined()
        })

        it("should get project with user in team", async () => {
            const {body} = await request().get(
                qs.stringifyUrl({
                    url: "/projects/getMany",
                    query: {
                        column: "teamMember",
                        value: user2.uid,
                    },
                }),
            )

            expect(body).toBeInstanceOf(Array)
            expect(body).toHaveLength(1)
            expect(body[0].id).toBe(1)
        })
    })

    describe("Delete", () => {
        it("should validate delete params", async () => {
            const {body} = await request()
                .del(`/teams/removeMember`)
                .send({
                    idToken: user1.idToken,
                    projectId: project.id,
                })
                .expect(400)

            expect(body.message).toContain("ValidationError")
        })

        it("should fail if project doesn't exist", async () => {
            const {body} = await request()
                .del(`/teams/removeMember`)
                .send({
                    idToken: user1.idToken,
                    projectId: 999,
                    memberUid: user8.uid,
                })
                .expect(404)

            expect(body.message).toContain("no project with id")
        })

        it("should only allow owner to delete members", async () => {
            const {body} = await request()
                .del(`/teams/removeMember`)
                .send({
                    idToken: user8.idToken,
                    projectId: project.id,
                    memberUid: user1.uid,
                })
                .expect(403)

            expect(body.message).toContain("you can't remove anyone")
        })

        it("should not allow owner to remove themselves", async () => {
            const {body} = await request()
                .del(`/teams/removeMember`)
                .send({
                    idToken: user1.idToken,
                    projectId: project.id,
                    memberUid: user1.uid,
                })
                .expect(400)

            expect(body.message).toContain("the owner cannot be removed")
        })

        it("should properly remove team member", async () => {
            await request()
                .del(`/teams/removeMember`)
                .send({
                    idToken: user1.idToken,
                    projectId: project.id,
                    memberUid: user8.uid,
                })
                .expect(204)

            // Try to write after removal
            const {body} = await request()
                .put("/projects/write")
                .send({
                    idToken: user8.idToken,
                    projectId: project.id,
                    desc: "team member change",
                })
                .expect(403)

            expect(body.message).toContain("not authorized to modify")

            const {body: body2} = await request().get(
                qs.stringifyUrl({
                    url: "/teams/get",
                    query: {
                        projectId: project.id,
                    },
                }),
            )

            expect(body2.members).toBeInstanceOf(Array)
            expect(body2.members.length).toBe(2)
            expect(body2.members.find((member) => member.uid === user1.uid)).toBeDefined()
            expect(body2.members.find((member) => member.uid === user8.uid)).toBeUndefined()
        })
    })
})
