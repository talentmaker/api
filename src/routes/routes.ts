/**
 * # Routes
 *
 * @file Express Route declarations go here
 */

import * as auth from "./auth"
import * as competitions from "./competitions"
import * as misc from "./misc"
import * as organizations from "./organization"
import * as projects from "./projects"
import * as teams from "./teams"
import * as users from "./users"

export type Options = {
    [K in "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head"]?:
        | ExpressHandler
        | ExpressHandler[]
}

/**
 * # Route type
 *
 * **A route consists of three parts:**
 *
 * - `name` - full name of route, or an array of routes
 * - `options` - object with maps a method to an array of handlers
 */
export type Route = [
    name: `/${string}` | undefined | (`/${string}` | undefined)[],
    options: Options,
]

/**
 * # RouteGroup
 *
 * For declaring a set of routes that share the same parent, such as `/auth/login` and `/auth/register`
 */
export type RouteGroup = [name: `/${string}`, subRoutes: (Route | RouteGroup | Options)[]]

/**
 * # Route declarations
 *
 * Routes are declared here with the `Route` type
 */
export const routes: (RouteGroup | Route)[] = [
    ["/contact", {post: misc.contact}],
    [
        "/auth",
        [
            ["/changePassword", {post: auth.changePassword}],
            ["/confirm", {post: auth.confirm}],
            ["/login", {post: auth.login}],
            ["/logout", {post: auth.logout}],
            ["/register", {post: auth.register}],
            ["/tokens", {get: auth.getTokensFromRefreshToken}],
        ],
    ],
    [
        "/competitions",
        [
            ["/get", {get: competitions.get}],
            ["/getMany", {get: competitions.getMany}],
            ["/join", {post: competitions.join}],
            ["/write", {post: competitions.create, put: competitions.update}],
        ],
    ],

    [
        "/organization",
        [
            ["/getMany", {get: organizations.getMany}],
            ["/request", {post: organizations.request}],
            ["/accept/:info", {get: organizations.userToOrganization}],
        ],
    ],
    [
        "/projects",
        [
            ["/write", {post: projects.create, put: projects.update, delete: projects.delete}],
            ["/get", {get: projects.get}],
            ["/getMany", {get: projects.getMany}],
        ],
    ],
    [
        "/teams",
        [
            ["/getLink", {get: teams.generateInviteLink}],
            ["/getLinkData/:data", {get: teams.getInviteLinkData}],
            ["/get", {get: teams.get}],
            ["/join/:data", {post: teams.join}],
            ["/removeMember", {delete: teams.removeMember}],
        ],
    ],
    [
        "/users",
        [
            ["/get/:uid", {get: users.get}],
            ["/getMany", {get: users.getMany}],
        ],
    ],
]

export default routes
