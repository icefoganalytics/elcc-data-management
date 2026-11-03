import Big from "big.js"

// TODO: rename to formatCurrency
export function formatMoney(
  input: number | string | Big | undefined,
  options: Intl.NumberFormatOptions & {
    locales?: string | string[] | undefined
  } = {}
): string {
  if (input === Infinity || input === -Infinity) {
    throw new Error("Infinity and -Infinity are not supported.")
  }

  if (Object.is(input, -0) || Number.isNaN(input) || input === undefined) {
    return "0"
  }

  const { locales = "en-CA", ...numberOptions } = options

  const formatter = new Intl.NumberFormat(locales, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
    ...numberOptions,
  })

  let inputAsNumber: number
  if (typeof input === "string") {
    inputAsNumber = Number(input)
  } else if (input instanceof Big) {
    inputAsNumber = input.toNumber()
  } else {
    inputAsNumber = input
  }

  return formatter.format(inputAsNumber)
}
