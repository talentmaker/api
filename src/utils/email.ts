import disposable from "disposable-email-domains"
import mailcheck from "mailcheck"

const disposableDomains: Set<string> = new Set(disposable)

type Suggestion = {
    address: string
    domain: string
    full: string
}

const checkTypo = (email: string): Promise<string | undefined> =>
    new Promise((resolve) =>
        mailcheck.run({
            email,
            suggested: (suggestion: Suggestion) =>
                resolve(`Likely typo, suggested: ${suggestion.full}`),
            empty: () => resolve(undefined),
        }),
    )

const checkDisposable = (domain: string): string | undefined =>
    disposableDomains.has(domain)
        ? "Email was created using a disposable email service"
        : undefined

export const checkEmail = async (email: string): Promise<string | undefined> => {
    const [, domain] = email.split("@")

    // istanbul ignore if
    if (!domain) {
        return "Domain could not be extracted"
    }

    const typoRes = await checkTypo(email)

    if (typoRes) {
        return typoRes
    }

    const disposableRes = checkDisposable(domain)

    return disposableRes
}
