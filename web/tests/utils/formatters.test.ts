import { formatDecimal, formatMoney } from "@/utils/formatters"

describe("web/src/utils/formatters", () => {
  describe("formatDecimal", () => {
    test.each([
      ["0.0000", "0"],
      ["4.0000", "4"],
      ["5.2500", "5.25"],
      ["0.0001", "0.0001"],
      ["12", "12"],
    ])("when formatting %s, trims only unused fractional zeros", (value, expected) => {
      // Act and Assert
      expect(formatDecimal(value)).toBe(expected)
    })
  })

  describe("formatMoney", () => {
    test.each([
      ["700.00", "$700"],
      ["27.4800", "$27.48"],
      ["12.3456", "$12.3456"],
    ])("when formatting %s, displays used decimal places", (value, expected) => {
      // Act and Assert
      expect(formatMoney(value)).toBe(expected)
    })

    test("when applying locale options, does not mutate the options object", () => {
      // Arrange
      const options = { locales: "de-DE", currency: "EUR" }

      // Act
      const displayed = formatMoney("1234.5", options)

      // Assert
      expect(displayed).toBe("1.234,5\u00a0€")
      expect(options).toEqual({ locales: "de-DE", currency: "EUR" })
    })

    test.each([
      [{ minimumFractionDigits: 2 }, "$700.00"],
      [{ maximumFractionDigits: 0 }, "$700"],
    ])("when explicit fraction options are provided, honors %j", (options, expected) => {
      // Act and Assert
      expect(formatMoney("700", options)).toBe(expected)
    })
  })
})
