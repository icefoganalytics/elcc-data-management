import { childCareCategoryFactory, fundingPeriodFactory } from "@/factories"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import CreateService from "@/services/quality-enhancement-categories/create-service"

describe("api/src/services/quality-enhancement-categories/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when a shared category is selected, persists its identity", async () => {
        // Arrange
        const childCareCategory = await childCareCategoryFactory.create()

        // Act
        await CreateService.perform({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "206.1000",
        })

        // Assert
        const categories = await QualityEnhancementCategory.findAll()
        expect(categories).toEqual([
          expect.objectContaining({ childCareCategoryId: childCareCategory.id }),
        ])
      })

      test("when a shared category belongs to another funding period, rejects creation", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategory = await childCareCategoryFactory.create()

        // Act
        const creation = CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "100.0000",
        })

        // Assert
        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })
    })
  })
})
