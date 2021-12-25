import {isDevelopment, isTesting} from "~/env"
import routes, {Options, Route, RouteGroup} from "./routes"
import type {Handler} from "express"
import {ServerResponse} from "http"
import Status from "~/statuses"

// istanbul ignore next
/**
 * Creates a wrapper handler which calls the existing handler
 *
 * @param func - Express handler function to call
 * @returns A wrapper function which handles any errors that may arise with the appropriate
 *   response depending on the error
 */
const createHandler = (func: ExpressHandler): Handler => {
    const handler: Handler = async (request, response, nextFunction) => {
        try {
            const result = await func(request, response, nextFunction)

            if (result === undefined) {
                return response.status(Status.NoContent).send()
            } else if (result instanceof ServerResponse) {
                return result
            }

            return response.status(Status.Ok).json(result)
        } catch (err: unknown) {
            if (isDevelopment || (isTesting && process.env.ERROR_LOG === "2")) {
                console.log(err)
            }

            if (err instanceof Error) {
                let status: number

                switch (err.name) {
                    case "AuthenticationError":
                        status = Status.Unauthorized
                        break

                    case "ValidationError":
                    case "SyntaxError":
                        status = Status.BadRequest
                        break

                    case "NotFoundError":
                        status = Status.NotFound
                        break

                    default:
                        status = Status.InternalError
                        break
                }

                if (err.message === "data failed integrity check") {
                    status = Status.Forbidden
                }

                if (
                    isTesting &&
                    process.env.ERROR_LOG === "1" &&
                    status === Status.InternalError
                ) {
                    console.log(err)
                }

                return response.status(status).json({
                    name: err.name,
                    message: err.toString(),
                })
            }

            return response.status(Status.InternalError).json({
                name: "Error",
                message: String(err),
            })
        }
    }

    return handler
}

// istanbul ignore next
/**
 * Recursively declares routes
 *
 * @param app - Express application
 * @param _routes - Group of routes or global routes
 * @param prefix - Prefix from previous routes
 */
export const declareRoutes = (
    app: import("express").Express,
    _routes: (Route | RouteGroup | Options)[] = routes,
    prefix = "",
): void => {
    for (const route of _routes) {
        if (Array.isArray(route)) {
            if (Array.isArray(route[1])) {
                declareRoutes(app, route[1], prefix + route[0])
            } else {
                const [name, handlers] = route

                for (const _method in handlers) {
                    const method = _method as keyof typeof handlers
                    const _handler = handlers[method]

                    if (_handler) {
                        const routeHandlers = Array.isArray(_handler) ? _handler : [_handler]

                        for (const handler of routeHandlers) {
                            const wrappedHandler = createHandler(handler)

                            // Change the name of the function from handler to whatever route[2] was. For debugging.
                            if (isDevelopment || isTesting) {
                                Object.defineProperty(wrappedHandler, "name", {
                                    value: handler.name,
                                })
                            }

                            // Declare the route in express
                            app[method](prefix + (name ?? ""), wrappedHandler)
                        }
                    }
                }
            }
        } else {
            declareRoutes(app, [[undefined, route]], prefix)
        }
    }
}

export default declareRoutes
