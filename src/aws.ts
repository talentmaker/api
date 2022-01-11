import {
    CognitoIdentityProvider,
    type CognitoIdentityProviderClientConfig,
} from "@aws-sdk/client-cognito-identity-provider"
import {LambdaClient, type LambdaClientConfig} from "@aws-sdk/client-lambda"
import {LambdaSes} from "lambda-ses/cjs"

interface Config extends CognitoIdentityProviderClientConfig, LambdaClientConfig {}

const config: Config = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    apiVersion: "2021-08-26",
    region: "us-east-1",
}

export const cognito = new CognitoIdentityProvider(config)
export const lambda = new LambdaClient(config)
export const lambdaSes = new LambdaSes(lambda, "lambda-ses")
