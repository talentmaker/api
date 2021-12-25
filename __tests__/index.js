import * as db from "../lib/db"
import {request} from "./utils"

describe("Test express server", () => {
    it("should work", async () => {
        const response = await request().get("/").expect(200)

        expect(response.text).toContain("Talentmaker API")
    })

    it("should show the 404 page", async () => {
        const response = await request().get("/notARoute").expect(404)

        expect(response.text).toContain("404")
    })
})

// Defer the import
await import("./routes")

describe("Rate limiting", () => {
    it("should ratelimit logins", async () => {
        for (let i = 0; i < 75; i++) {
            const response = await request().post("/auth/login").send({
                email: "test@test.com",
                password: "wrong",
            })

            if (response.status === 429) {
                expect(response.body.message).toContain("Too many auth attempts")

                return
            }
        }

        throw new Error("failed to ratelimit logins")
    })

    it("should ratelimit", async () => {
        for (let i = 0; i < 500; i++) {
            const response = await request().get("/")

            if (response.status === 429) {
                expect(response.body.message).toContain("You are being rate limited")

                return
            }
        }

        throw new Error("failed to ratelimit")
    })
})

afterAll(async () => await db.prisma.$disconnect())
