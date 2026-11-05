export function formatDecimal(value: string | number): string {
  const decimal = String(value)
  const decimalPoint = decimal.indexOf(".")

  if (decimalPoint === -1) {
    return decimal
  }

  const trimmedFraction = decimal.slice(decimalPoint + 1).replace(/0+$/, "")
  return trimmedFraction
    ? `${decimal.slice(0, decimalPoint)}.${trimmedFraction}`
    : decimal.slice(0, decimalPoint)
}
