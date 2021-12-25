import Status from "~/statuses"

// istanbul ignore next
export const logout: ExpressHandler = (_, response) =>
    response
        .cookie("refreshToken", "", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 0, // "delete" the cookie
        })
        .status(Status.NoContent)
        .json()
