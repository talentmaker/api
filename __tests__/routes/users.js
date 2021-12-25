import * as yup from "yup"
import {bulkUserSchema, publicDbUserSchema} from "./organizations"
import {generateUUID, login} from "../utils"
import {projectSchema} from "./projects"
import {request} from "../utils"
import qs from "query-string"
import users from "./users.json"

describe("Test users", () => {
    beforeAll(async () => {
        for (const name of users.names) {
            const [first, last] = name.toLowerCase().split(" ")
            const username = `${first}_${last[0]}${Math.round(Math.random() * 9)}`
            const password = generateUUID()

            await request()
                .post("/auth/register")
                .send({
                    username,
                    email: `${username}@gmail.com`,
                    password,
                })
                .expect(204)

            await login({
                email: `${username}@gmail.com`,
                password,
            })
        }
    })

    test("404 on no user", async () => {
        await request().get(`/users/get/${generateUUID()}`).send().expect(404)
    })

    test("get user", async () => {
        const {creatorId: user} = await projectSchema.validate(
            (
                await request()
                    .get(qs.stringifyUrl({url: "/projects/get", query: {id: 1}}))
                    .send()
                    .expect(200)
            ).body,
        )

        const {body} = await request().get(`/users/get/${user}`).send().expect(200)

        await publicDbUserSchema.validate(body)

        expect(body.uid).toBe(user)
    })

    test("get user with projects", async () => {
        const {creatorId: user} = await projectSchema.validate(
            (
                await request()
                    .get(qs.stringifyUrl({url: "/projects/get", query: {id: 1}}))
                    .send()
                    .expect(200)
            ).body,
        )

        const {body} = await request()
            .get(`/users/get/${user}?shouldFetchProjects=true`)
            .send()
            .expect(200)

        await publicDbUserSchema
            .shape({projects: yup.array(projectSchema).optional()})
            .validate(body)

        expect(body.uid).toBe(user)
    })

    test("get many users", async () => {
        /**
         * @type {{body: Pick<import("../utils/types").User, "username" | "uid">[]}}
         */
        const {body: users} = await request().get("/users/getMany").send().expect(200)

        await bulkUserSchema.validate(users)
        expect(users).toHaveLength(30)
    })

    test("get many users by search", async () => {
        /**
         * @type {{body: Pick<import("../utils/types").User, "username" | "uid">[]}}
         */
        const {body: users} = await request()
            .get("/users/getMany?search=shaun c")
            .send()
            .expect(200)

        expect(users).toBeInstanceOf(Array)
        expect(users.find((user) => user.username.includes("shaun"))).toBeDefined()
        expect(users.find((user) => user.username.includes("sean"))).toBeDefined()
        expect(users.find((user) => user.username.includes("shawn"))).toBeDefined()
        expect(users.find((user) => user.username.includes("jean"))).toBeDefined()
    })

    test("get many users by search 2", async () => {
        /**
         * @type {{body: Pick<import("../utils/types").User, "username" | "uid">[]}}
         */
        const {body: users} = await request()
            .get("/users/getMany?search=owen l")
            .send()
            .expect(200)

        expect(users).toBeInstanceOf(Array)
        expect(users.find((user) => user.username.includes("owen"))).toBeDefined()
        expect(users.find((user) => user.username.includes("cohen"))).toBeDefined()
    })

    test("get many users by search 3", async () => {
        /**
         * @type {{body: Pick<import("../utils/types").User, "username" | "uid">[]}}
         */
        const {body: users} = await request().get("/users/getMany?search=hanna").send().expect(200)

        expect(users).toBeInstanceOf(Array)
        expect(users.find((user) => user.username.includes("hanna"))).toBeDefined()
        expect(users.find((user) => user.username.includes("hana"))).toBeDefined()
        expect(users.find((user) => user.username.includes("hannah"))).toBeDefined()
    })

    test("get many users by search 4", async () => {
        /**
         * @type {{body: Pick<import("../utils/types").User, "username" | "uid">[]}}
         */
        const {body: users} = await request().get("/users/getMany?search=tyler").send().expect(200)

        expect(users).toBeInstanceOf(Array)
        expect(users.find((user) => user.username.includes("tyler"))).toBeDefined()
        expect(users.find((user) => user.username.includes("taylor"))).toBeDefined()
    })

    test("user search does not show organization", async () => {
        /**
         * @type {{body: Pick<import("../utils/types").User, "username" | "uid">[]}}
         */
        const {body: users} = await request()
            .get("/users/getMany?search=test user 3")
            .send()
            .expect(200)

        expect(users).toBeInstanceOf(Array)
        expect(users.find((user) => user.username === "test user 3")).toBeUndefined()
        expect(users.find((user) => user.username === "test user")).toBeDefined()
        expect(users.find((user) => user.username === "test user 2")).toBeDefined()

        expect(users.find((user) => user.username === "test user").projectCount).toBe(1)
        expect(users.find((user) => user.username === "test user 2").projectCount).toBe(1)
        expect(users.find((user) => user.username === "test user 8").projectCount).toBe(0)
    })
})
