import Big from "big.js"

// TODO: rename to formatCurrency
export function formatMoney(
  input: string | Big | undefined,
  options: Intl.NumberFormatOptions & {
    locales?: string | string[] | undefined
  } = {}
): string {
  if (input === undefined) {
    return "0"
  }

  const { locales = "en-CA", ...formatterOptions } = options
  const formatter = new Intl.NumberFormat(locales, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "symbol",
    ...formatterOptions,
  })
  const formatDecimal = formatter.format as unknown as (value: string) => string
  const decimalValue = input instanceof Big ? input.toFixed() : input

  return formatDecimal(decimalValue)
}
