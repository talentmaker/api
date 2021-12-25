import {UserDetails, users} from "./users"
import {generateUUID} from "./util"

export class CognitoUserAttribute {
    public readonly Name: string

    public readonly Value: string

    public constructor(options: {Name: string; Value: string}) {
        this.Name = options.Name
        this.Value = options.Value
    }
}

export class CognitoUserSession {
    public constructor(public readonly user: CognitoUser) {}

    public getRefreshToken = (): {[key: string]: unknown} => ({
        getToken: (): string => this.user.username,
    })

    public getAccessToken = (): {[key: string]: unknown} => ({
        getJwtToken: (): string => this.user.username,
    })

    public getIdToken = (): {[key: string]: unknown} => {
        const user = this.user.pool.findUser(this.user.username)

        if (user === undefined) {
            throw new Error(`No user with username ${this.user.username}`)
        }

        const epochTime = Date.now()

        const payload = {
            email: user.email,
            sub: user.sub,
            preferred_username: user.preferredUsername,
            aud: process.env.CLIENT_ID,
            email_verified: true,
            event_id: "event id",
            token_use: "id",
            auth_time: epochTime,
            iss: process.env.USER_POOL_ID,
            "cognito:username": user.sub,
            exp: epochTime + 10_000,
            iat: epochTime,
        }

        return {
            getJwtToken: (): string => JSON.stringify(payload),
            payload,
        }
    }
}

export class CognitoUser {
    public readonly username: string

    public readonly pool: CognitoUserPool

    public constructor(data: {Username: string; Pool: CognitoUserPool}) {
        this.username = data.Username
        this.pool = data.Pool
    }

    public authenticateUser = (
        details: AuthenticationDetails,
        callbacks: {
            onSuccess: (res: CognitoUserSession) => void
            onFailure: (err: unknown) => void
        },
    ): void => {
        const user = this.pool.findUser(details.username)

        if (!user) {
            callbacks.onFailure(new Error(`No user with username ${details.username}`))

            return
        } else if (user.password !== details.password) {
            callbacks.onFailure(new Error(`Incorrect password`))

            return
        }

        callbacks.onSuccess(new CognitoUserSession(this))
    }

    public getUserAttributes = (
        callback: (err: Error | null, result: CognitoUserAttribute[] | null) => void,
    ): void => {
        const user = this.pool.findUser(this.username)

        if (!user) {
            callback(new Error(`No user with username ${this.username}`), null)

            return
        }

        callback(null, [
            new CognitoUserAttribute({Name: "email", Value: user.email}),
            new CognitoUserAttribute({Name: "preferred_username", Value: user.preferredUsername}),
        ])
    }

    public changePassword = (
        oldPassword: string,
        newPassword: string,
        callback: (err: Error | null, result: "SUCCESS" | null) => void,
    ): void => {
        const user = users[this.pool.userPoolId]?.[this.username]

        if (!user) {
            callback(new Error(`No user with username ${this.username}`), null)

            return
        } else if (user.password !== oldPassword) {
            callback(new Error("Incorrect password"), null)

            return
        }

        users[this.pool.userPoolId]![this.username]!.password = newPassword

        callback(null, "SUCCESS")
    }

    public globalSignOut = (callbacks: {
        onSuccess: (msg: string) => void
        onFailure: (err: Error) => void
    }): void => {
        callbacks.onSuccess("Success")
    }
}

export class CognitoUserPool {
    public readonly userPoolId: string

    public constructor({UserPoolId}: {UserPoolId: string}) {
        this.userPoolId = UserPoolId
    }

    public findUser = (username: string): UserDetails | undefined =>
        users[this.userPoolId]?.[username]

    public signUp = (
        email: string,
        password: string,
        attributeList: CognitoUserAttribute[],
        _validationData: CognitoUserAttribute[],
        callback: (err: Error | undefined, result?: {user: CognitoUser}) => void,
    ) => {
        const preferredUsername = attributeList.find((attr) => attr.Name === "preferred_username")

        if (preferredUsername === undefined) {
            callback(new Error("preferred_username is undefined"))

            return
        }

        const userPool = (users[this.userPoolId] ??= {})

        if (userPool[email] !== undefined) {
            callback(new Error("An account with the given email already exists"))

            return
        }

        userPool[email] = {
            email,
            password,
            sub: generateUUID(),
            preferredUsername: preferredUsername.Value,
        }

        callback(undefined, {user: new CognitoUser({Username: email, Pool: this})})
    }
}

export class AuthenticationDetails {
    public readonly username: string

    public readonly password: string

    public constructor(details: {Username: string; Password: string}) {
        this.username = details.Username
        this.password = details.Password
    }
}

export {users}
