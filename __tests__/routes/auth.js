import * as yup from "yup"
import base64 from "base64-url"
import {request} from "../utils"
import {verifyQuiet} from "../../lib/jwt"

const authResult = yup.object({
    idToken: yup.string().required(),
    email: yup.string().required(),
    uid: yup.string().required(),
    username: yup.string().required(),
    isOrganization: yup.boolean().required(),
})

const register = async (username, email, password) =>
    await request()
        .post("/auth/register")
        .send({
            username,
            email,
            password,
        })
        .expect(204)

describe("Test authentication", () => {
    describe("Registration", () => {
        it("should validate registration", async () => {
            const {body} = await request().post("/auth/register").send().expect(400)

            expect(body.message).toContain("ValidationError")
        })

        it("should validate dispoable emails", async () => {
            const {body} = await request()
                .post("/auth/register")
                .send({
                    username: "test user",
                    email: "akq19271@eoopy.com",
                    password: "abc123",
                })
                .expect(400)

            expect(body.message).toContain("created using a disposable email service")
        })

        it("should validate email typos", async () => {
            const {body} = await request()
                .post("/auth/register")
                .send({
                    username: "test user",
                    email: "test@gnail.com",
                    password: "abc123",
                })
                .expect(400)

            expect(body.message).toContain("Likely typo, suggested: test@gmail.com")
        })

        it("should register user", async () => {
            for (let i = 0; i <= 8; i++) {
                await register(`test user${i ? ` ${i}` : ""}`, `test${i || ""}@test.com`, "abc123")
            }
        })

        it("should prevent duplicate users", async () => {
            const {body} = await request()
                .post("/auth/register")
                .send({
                    username: "test user",
                    email: "test@test.com",
                    password: "abc123",
                })
                .expect(401)

            expect(body.message).toContain("already exists")
        })
    })

    describe("Login", () => {
        it("should validate login", async () => {
            await request()
                .post("/auth/login")
                .send({
                    email: "test@test.com",
                })
                .expect(400)
        })

        it("should reject unknown user", async () => {
            const {body} = await request()
                .post("/auth/login")
                .send({
                    email: "notAUser@mail.com",
                    password: "abc123",
                })
                .expect(401)

            expect(body.message).toContain("No user with username")
        })

        it("should reject incorrect password", async () => {
            const {body} = await request()
                .post("/auth/login")
                .send({
                    email: "test@test.com",
                    password: "wrong",
                })
                .expect(401)

            expect(body.message).toContain("Incorrect password")
        })

        it("should login properly", async () => {
            const {body} = await request()
                .post("/auth/login")
                .send({
                    email: "test@test.com",
                    password: "abc123",
                })
                .expect(200)

            await authResult.validate(body, {strict: true})
        })
    })

    describe("Token", () => {
        it("should reject modified token", async () => {
            const {body} = await request()
                .post("/auth/login")
                .send({
                    email: "test@test.com",
                    password: "abc123",
                })
                .expect(200)

            const {body: user2} = await request()
                .post("/auth/login")
                .send({
                    email: "test2@test.com",
                    password: "abc123",
                })
                .expect(200)

            const {idToken} = await authResult.validate(body, {strict: true})
            const bIdToken = Buffer.from(base64.unescape(idToken), "base64")

            const saltAndHash = bIdToken.slice(0, 64 + 32)
            const data = JSON.parse(bIdToken.slice(64 + 32).toString("utf-8"))
            const tamperedToken = base64.escape(
                Buffer.concat([
                    saltAndHash,
                    Buffer.from(
                        JSON.stringify({
                            ...data,
                            uid: user2.uid,
                        }),
                        "utf-8",
                    ),
                ]).toString("base64"),
            )

            const verifyResult = await verifyQuiet(tamperedToken)

            expect(verifyResult).toBeInstanceOf(Error)
            expect(verifyResult.message).toBe("data failed integrity check")
        })

        it("should accept valid token", async () => {
            const {body} = await request()
                .post("/auth/login")
                .send({
                    email: "test@test.com",
                    password: "abc123",
                })
                .expect(200)

            const {idToken, uid} = await authResult.validate(body, {strict: true})

            const verifyResult = await verifyQuiet(idToken)

            expect(verifyResult).toMatchObject({
                uid,
                isVerified: true,
            })
        })
    })

    describe("Change Password", () => {
        it("should not change password if old password is wrong", async () => {
            const {body} = await request()
                .post("/auth/changePassword")
                .send({
                    email: "test@test.com",
                    oldPassword: "123abc",
                    newPassword: "123abc",
                })
                .expect(401)

            expect(body.message).toContain("Incorrect password")
        })

        it("should change password", async () => {
            await request()
                .post("/auth/changePassword")
                .send({
                    email: "test@test.com",
                    oldPassword: "abc123",
                    newPassword: "123abc",
                })
                .expect(204)

            const {body} = await request()
                .post("/auth/login")
                .send({
                    email: "test@test.com",
                    password: "abc123",
                })
                .expect(401)

            expect(body.message).toContain("Incorrect password")

            await request()
                .post("/auth/changePassword")
                .send({
                    email: "test@test.com",
                    oldPassword: "123abc",
                    newPassword: "abc123",
                })
                .expect(204)
        })
    })
})
