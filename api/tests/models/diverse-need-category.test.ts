import { diverseNeedCategoryFactory } from "@/factories/diverse-need-category-factory"

describe("api/src/models/diverse-need-category.ts", () => {
  describe("DiverseNeedCategory", () => {
    describe("#validate", () => {
      test("when monthly amount has more than four decimal places, rejects the value", async () => {
        // Arrange
        const category = diverseNeedCategoryFactory.build({
          fundingPeriodId: 1,
          monthlyAmount: "54.96001",
        })

        // Act
        const validation = category.validate()

        // Assert
        await expect(validation).rejects.toThrow("at most four decimal places")
      })
    })
  })
})
