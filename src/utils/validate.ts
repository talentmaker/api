import * as yup from "yup"
import {inlineTryPromise} from "@luke-zhang-04/utils/cjs"

/**
 * Quietly validate data against a yup schema and return the error or schema
 *
 * @param schema - Yup schema to validate
 * @param data - Data to compare schema against
 * @returns Promise with either an Error if the schema does not match, or the data in validated form
 */
export const validate = async <T extends yup.BaseSchema>(
    schema: T,
    data: unknown,
): Promise<T["__outputType"] | Error> => {
    const result = await inlineTryPromise(async () => await schema.validate(data))

    if (result instanceof Error) {
        result.message = `${result.name}: ${result.message}`
    }

    return result
}

/**
 * Quietly validate data against a yup schema and return the error or schema
 *
 * @param schema - Yup schema to validate
 * @param data - Data to compare schema against
 * @returns Promise with either an Error if the schema does not match, or the data in validated form
 */
export const validateHard = async <T extends yup.BaseSchema>(
    schema: T,
    data: unknown,
): Promise<T["__outputType"]> => {
    const result = await inlineTryPromise(async () => await schema.validate(data))

    if (result instanceof Error) {
        result.name = "InternalValidationError"

        throw result
    }

    return result
}
