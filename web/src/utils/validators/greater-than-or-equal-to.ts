import Big from "big.js"
import { isNil } from "lodash"

export function greaterThanOrEqualTo(
  minimum: number,
  { referenceFieldLabel }: { referenceFieldLabel?: string } = {}
): (value: unknown) => boolean | string {
  return (value: unknown) => {
    if (isNil(value) || value === "") {
      return true
    }
    if (typeof value !== "string" && typeof value !== "number") {
      return `This field must be a number`
    }

    try {
      if (Big(value).gte(Big(minimum))) {
        return true
      }
    } catch {
      return `This field must be a number`
    }

    const minimumLabel = referenceFieldLabel || minimum

    return `This field must be greater than or equal to ${minimumLabel}`
  }
}

export default greaterThanOrEqualTo
