import {isDevelopment, isTesting} from "./env"
import dotenv from "dotenv"
import path from "path"

// istanbul ignore else
if (isTesting) {
    dotenv.config({path: path.resolve(__dirname, "../.env.testing")})
    dotenv.config({path: path.resolve(__dirname, "../.env.example")})
} else if (isDevelopment) {
    dotenv.config({path: path.resolve(__dirname, "../.env.development")})
    dotenv.config({path: path.resolve(__dirname, "../.env")})
} else {
    dotenv.config({path: path.resolve(__dirname, "../.env")})
}
