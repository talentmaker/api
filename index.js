const app = require("./lib").default

const port = !process.env.PORT || process.env.PORT === "default" ? 3333 : Number(process.env.PORT)

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

process.on("exit", () => server.close())
process.on("beforeExit", () => server.close())
process.on("SIGINT", () => server.close())
