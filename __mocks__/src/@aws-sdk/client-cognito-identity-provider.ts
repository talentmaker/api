import {users} from "../amazon-cognito-identity-js"

export class CognitoIdentityProvider {
    public adminGetUser = async ({
        Username: sub,
        UserPoolId: userPoolId,
    }: {
        Username: string
        UserPoolId: string
    }): Promise<{[key: string]: unknown}> => {
        const user = Object.values(users[userPoolId] ?? {}).find((_user) => _user.sub === sub)

        if (user) {
            return {
                Username: sub,
                UserStatus: "CONFIRMED",
                UserCreateDate: new Date(),
                UserAttributes: [
                    {
                        Name: "email",
                        Value: user.email,
                    },
                    {
                        Name: "preferred_username",
                        Value: user.preferredUsername,
                    },
                ],
            }
        }

        throw new Error(`No user with subject ${sub}`)
    }
}
