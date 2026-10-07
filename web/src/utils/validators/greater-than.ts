import Big from "big.js"
import { isEmpty, isNil, isString } from "lodash"

export function greaterThan(
  minimum: number | string | null | undefined,
  { referenceFieldLabel }: { referenceFieldLabel?: string } = {}
): (value: unknown) => boolean | string {
  return (value: unknown) => {
    if (isNil(minimum) || (isString(minimum) && isEmpty(minimum))) return true
    if (isNil(value) || (isString(value) && isEmpty(value))) return true
    if (typeof minimum !== "string" && typeof minimum !== "number") {
      return `This field must be a number`
    }
    if (typeof value !== "string" && typeof value !== "number") {
      return `This field must be a number`
    }

    try {
      if (Big(value).gt(Big(minimum))) {
        return true
      }
    } catch {
      return `This field must be a number`
    }

    const minimumLabel = referenceFieldLabel || minimum

    return `This field must be greater than ${minimumLabel}`
  }
}

export default greaterThan
