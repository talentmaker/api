import {CognitoIdentityProvider} from "@aws-sdk/client-cognito-identity-provider"
import type {CognitoIdentityProviderClientConfig} from "@aws-sdk/client-cognito-identity-provider"
import {SES} from "@aws-sdk/client-ses"
import type {SESClientConfig} from "@aws-sdk/client-ses"

interface Config extends CognitoIdentityProviderClientConfig, SESClientConfig {}

const config: Config = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    apiVersion: "2021-08-26",
    region: "us-east-1",
}

export const cognito = new CognitoIdentityProvider(config)
export const ses = new SES(config)
