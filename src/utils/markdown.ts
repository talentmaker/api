import DOMPurify from "isomorphic-dompurify"
import Re2 from "re2"

/**
 * Sanitizes markdown synchronously
 *
 * @param content - Markdown to sanatize
 * @returns Sanitized markdown
 */
export const purifyMarkdownSync = (content: string): string =>
    DOMPurify.sanitize(content.replace(new Re2(/\n>/giu), "\n\\>")).replace(
        new Re2(/\n\\(?<blockquote>&gt;|>)/giu),
        "\n>",
    )

/**
 * Sanitizes markdown asynchronously
 *
 * @param content - Markdown to sanatize
 * @returns Sanitized markdown
 */
export const purifyMarkdown = (...args: Parameters<typeof purifyMarkdownSync>): Promise<string> =>
    Promise.resolve().then(() => purifyMarkdownSync(...args))

export default purifyMarkdown
