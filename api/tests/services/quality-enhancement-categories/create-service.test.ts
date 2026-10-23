import { childCareSpaceCategoryFactory, fundingPeriodFactory } from "@/factories"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import CreateService from "@/services/quality-enhancement-categories/create-service"

describe("api/src/services/quality-enhancement-categories/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when the space category belongs to the funding period, persists the link", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const spaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create()

        // Act
        await CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants Quality Enhancement",
          monthlyAmount: "206.1000",
          childCareSpaceCategoryId: spaceCategory.id,
        })

        // Assert
        const categories = await QualityEnhancementCategory.findAll()
        expect(categories).toEqual([
          expect.objectContaining({
            childCareSpaceCategoryId: spaceCategory.id,
          }),
        ])
      })

      test("when the space category belongs to another funding period, rejects the link", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const otherFundingPeriod = await fundingPeriodFactory.create()
        const otherSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create()

        // Act / Assert
        await expect(
          CreateService.perform({
            fundingPeriodId: fundingPeriod.id,
            categoryName: "Unmatched Quality Enhancement",
            monthlyAmount: "100.0000",
            childCareSpaceCategoryId: otherSpaceCategory.id,
          })
        ).rejects.toThrow("Child Care Space category must belong to the same funding period")
      })
    })
  })
})
