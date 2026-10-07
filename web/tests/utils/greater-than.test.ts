import greaterThan from "@/utils/validators/greater-than"
import greaterThanOrEqualTo from "@/utils/validators/greater-than-or-equal-to"

describe("web/src/utils/validators/greater-than.ts", () => {
  describe("greaterThan", () => {
    test("when decimal strings differ beyond JavaScript number precision, compares their exact values", () => {
      // Arrange
      const minimum = "9007199254740993.0000"
      const value = "9007199254740993.0001"

      // Act
      const result = greaterThan(minimum)(value)

      // Assert
      expect(result).toBe(true)
    })
  })
})

describe("web/src/utils/validators/greater-than-or-equal-to.ts", () => {
  describe("greaterThanOrEqualTo", () => {
    test("when a decimal string equals its minimum, accepts the exact value", () => {
      // Arrange
      const minimum = 0
      const value = "0.0000"

      // Act
      const result = greaterThanOrEqualTo(minimum)(value)

      // Assert
      expect(result).toBe(true)
    })
  })
})
