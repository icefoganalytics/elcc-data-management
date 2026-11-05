import { childrenWithDiverseNeedsFundingCategoryFactory } from "@/factories/children-with-diverse-needs-funding-category-factory"

describe("api/src/models/children-with-diverse-needs-funding-category.ts", () => {
  describe("ChildrenWithDiverseNeedsFundingCategory", () => {
    describe("#validate", () => {
      test("when monthly amount has more than four decimal places, rejects the value", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          fundingPeriodId: 1,
          monthlyAmount: "54.96001",
        })

        // Act
        const validation = category.validate()

        // Assert
        await expect(validation).rejects.toThrow("at most four decimal places")
      })
    })
    describe("#create", () => {
      test("when no age range is configured, preserves both nullable bounds", async () => {
        // Arrange
        const attributes = { fromAge: null, toAge: null }

        // Act
        const category = await childrenWithDiverseNeedsFundingCategoryFactory.create(attributes)

        // Assert
        expect(category).toMatchObject({ fromAge: null, toAge: null })
      })
    })
  })
})
