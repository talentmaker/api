// eslint-disable-next-line
/// <reference types="node" />

declare namespace NodeJS {
    interface ProcessEnv {
        readonly NODE_ENV?: "development" | "production" | "test" | "offline"

        readonly DB_PASSWORD: string
        readonly DB_URL: string
        readonly PORT: "default" | string

        readonly USER_POOL_ID: string
        readonly CLIENT_ID: string
        readonly COGNITO_URL: string

        readonly KEY1: string
        readonly KEY2: string
        readonly KEY3: string

        readonly AWS_ACCESS_KEY_ID: string
        readonly AWS_SECRET_ACCESS_KEY: string
    }
}

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

type ExpressHandler<
    P = import("express-serve-static-core").ParamsDictionary,
    ReqBody = unknown,
    ReqQuery = import("express-serve-static-core").Query,
    Locals extends {[key: string]: unknown} = {[key: string]: unknown},
> = (
    ...params: Parameters<
        import("express-serve-static-core").RequestHandler<P, unknown, ReqBody, ReqQuery, Locals>
    >
) => import("@luke-zhang-04/utils/types").MaybePromise<
    void | import("express").Response | {[key: string]: unknown}
>

declare module "module-alias" {
    type Mod = {
        addAliases(aliases: {[key: string]: string}): void
        addAlias(alias: string, dest: string): void
    }

    const mod: Mod

    export = mod
}
