export type UserDetails = {
    email: string
    password: string
    sub: string
    preferredUsername: string
}

export const users: {[poolId: string]: {[username: string]: UserDetails}} = {}
