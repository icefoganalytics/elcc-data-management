import { formatMoney } from "@/utils/formatters"

describe("web/src/utils/formatters/format-money.ts", () => {
  describe("formatMoney", () => {
    test("when formatting a high-precision decimal string, preserves every decimal digit", () => {
      // Arrange
      const highPrecisionDecimal = "9007199254740993.0001"

      // Act
      const formattedMoney = formatMoney(highPrecisionDecimal, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })

      // Assert
      expect(formattedMoney).toBe("$9,007,199,254,740,993.0001")
    })
  })
})
