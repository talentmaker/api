export const isProduction =
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === undefined
export const isDevelopment =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "offline"
export const isTesting = process.env.NODE_ENV === "test"
export const isOffline = process.env.NODE_ENV === "offline"
