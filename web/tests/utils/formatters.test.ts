import { formatDecimal, formatMoney } from "@/utils/formatters"

describe("web/src/utils/formatters", () => {
  describe("formatDecimal", () => {
    test("when stored decimals have unused zeros, trims padding without dropping meaningful digits", () => {
      // Arrange
      const values = ["0.0000", "4.0000", "5.2500", "0.0001", "12"]

      // Act
      const displayed = values.map((value) => formatDecimal(value))

      // Assert
      expect(displayed).toEqual(["0", "4", "5.25", "0.0001", "12"])
    })
  })

  describe("formatMoney", () => {
    test("when stored amounts have unused zeros, displays only meaningful fractional digits", () => {
      // Arrange
      const amounts = ["700.00", "27.4800", "12.3456"]

      // Act
      const displayed = amounts.map((amount) => formatMoney(amount))

      // Assert
      expect(displayed).toEqual(["$700", "$27.48", "$12.3456"])
    })

    test("when applying locale options, formats the amount using that locale", () => {
      // Arrange
      const options = { locales: "de-DE", currency: "EUR" }

      // Act
      const displayed = formatMoney("1234.5", options)

      // Assert
      expect(displayed).toBe("1.234,5\u00a0€")
    })

    test("when applying locale options, does not mutate the options object", () => {
      // Arrange
      const options = { locales: "de-DE", currency: "EUR" }

      // Act
      formatMoney("1234.5", options)

      // Assert
      expect(options).toEqual({ locales: "de-DE", currency: "EUR" })
    })

    test.each([
      ["700", "minimumFractionDigits", 2, "$700.00"],
      ["700.125", "maximumFractionDigits", 0, "$700"],
    ] as const)(
      "when formatting %s, honors explicit %s of %s",
      (amount, option, digits, expected) => {
        // Arrange
        const options: Intl.NumberFormatOptions = { [option]: digits }

        // Act
        const displayed = formatMoney(amount, options)

        // Assert
        expect(displayed).toBe(expected)
      }
    )
  })
})
