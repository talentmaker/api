import "./registerModuleAliases"
import "./dotenv"
import {daysToMs, hrsToMs, minsToMs} from "@luke-zhang-04/dateplus/dist/cjs/dateplus.min.cjs"
import {isDevelopment, isProduction, isTesting} from "./env"
import Status from "./statuses"
import chalk from "chalk"
import compression from "compression"
import cookieParser from "cookie-parser"
import cors from "cors"
import {declareRoutes} from "./routes"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"
import ratelimit from "express-rate-limit"

export const app = express()

// istanbul ignore next
// Allowed origins for CORS
// NOTE: CORS has been disabled for production
const origin = isProduction
    ? ["https://talentmaker.ca", "https://www.talentmaker.ca"]
    : [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:5000",
          "http://127.0.0.1:5000",
      ]

app.use(
    // Disable CORS for production
    ...(isProduction
        ? []
        : [
              cors({
                  origin,
                  optionsSuccessStatus: Status.Ok,
                  credentials: true,
              }),
          ]),
    express.json(),
    helmet(),
    ratelimit({
        windowMs: minsToMs(1),
        // istanbul ignore next
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        max: isTesting ? 500 : 250, // For testing
        draft_polli_ratelimit_headers: true,
        handler: (_, response) =>
            response.status(Status.TooManyRequests).json({
                message: "You are being rate limited.",
            }),
    }),
    compression(),
    cookieParser(),
)

app.use(
    ["/auth", "/auth/*"],
    ratelimit({
        windowMs: minsToMs(5),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        max: isTesting ? 75 : 15,
        draft_polli_ratelimit_headers: true,
        skipSuccessfulRequests: true,
        handler: (_, response) =>
            response.status(Status.TooManyRequests).json({
                message: "Too many auth attempts. Try again in 5 minutes.",
            }),
    }),
)

app.use(
    ["/auth/confirm", "/auth/register"],
    ratelimit({
        windowMs: hrsToMs(6),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        max: isTesting ? 75 : 5,
        draft_polli_ratelimit_headers: true,
        skipSuccessfulRequests: false,
        handler: (_, response) =>
            response.status(Status.TooManyRequests).json({
                message: "Too many confrimation or register attempts.",
            }),
    }),
)

app.use(
    ["/contact"],
    ratelimit({
        windowMs: daysToMs(1),
        max: 1,
        draft_polli_ratelimit_headers: true,
        skipFailedRequests: true,
        skipSuccessfulRequests: false,
        handler: (_, response) =>
            response.status(Status.TooManyRequests).json({
                message: "Contacted too many times.",
            }),
    }),
    ratelimit({
        windowMs: daysToMs(1),
        max: 5,
        draft_polli_ratelimit_headers: true,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        handler: (_, response) =>
            response.status(Status.TooManyRequests).json({
                message: "Contacted too many times.",
            }),
    }),
)

// istanbul ignore next
if (isDevelopment) {
    const fillZero = (value: number): string => (value < 10 ? `0${value}` : value.toString())

    const getFormattedTime = (): string => {
        const date = new Date()
        const hourThreshold = 12

        return `${date.getHours() % hourThreshold}:${fillZero(date.getMinutes())}:${fillZero(
            date.getSeconds(),
        )} ${date.getHours() >= hourThreshold ? "PM" : "AM"}`
    }

    app.use(
        morgan((tokens, req, res) => {
            const status = Number(tokens.status?.(req, res))
            const formattedStatus = (() => {
                if (status >= Status.InternalError) {
                    return chalk.red(status)
                } else if (status >= Status.BadRequest) {
                    return chalk.yellow(status)
                } else if (status >= Status.MultipleChoices) {
                    return chalk.white(status)
                } else if (status >= Status.Ok) {
                    return chalk.green(status)
                }

                return chalk.cyan(status)
            })()
            const contentLength = tokens.res?.(req, res, "content-length")

            return [
                getFormattedTime(),
                "-",
                chalk.cyan.bold(tokens.method?.(req, res)),
                chalk.green(tokens.url?.(req, res)?.split("?")[0]),
                formattedStatus,
                chalk.blue(tokens["response-time"]?.(req, res)),
                "ms",
                contentLength ? `- ${contentLength}` : contentLength,
            ].join(" ")
        }),
    )
}

declareRoutes(app)

app.get("/", (_, response) =>
    response.status(Status.Ok).sendFile(path.resolve(__dirname, "../static/index.html")),
)
// istanbul ignore next
app.get("/static/js/applyClassName.js", (_, response) =>
    response
        .status(Status.Ok)
        .set("Content-type", "text/javascript,")
        .sendFile(path.resolve(__dirname, "../static/js/applyClassName.js")),
)

// Handle 404
app.use((_, response) =>
    response.status(Status.NotFound).sendFile(path.resolve(__dirname, "../static/404.html")),
)

export default app
