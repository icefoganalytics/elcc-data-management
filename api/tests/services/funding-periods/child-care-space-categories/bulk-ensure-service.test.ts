import { ChildCareSpaceCategory } from "@/models"

import { childCareSpaceCategoryFactory, fundingPeriodFactory } from "@/factories"
import { BulkEnsureService } from "@/services/funding-periods/child-care-space-categories/bulk-ensure-service"

describe("api/src/services/funding-periods/child-care-space-categories/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when all categories have been deleted, preserves the deliberate empty configuration", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const deletedCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Retired category" })
        await deletedCategory.destroy()

        // Act
        await BulkEnsureService.perform(fundingPeriod)
        await BulkEnsureService.perform(fundingPeriod)

        const historicalCategories = await ChildCareSpaceCategory.findAll({
          paranoid: false,
        })

        // Assert
        expect(historicalCategories).toEqual([
          expect.objectContaining({
            id: deletedCategory.id,
            categoryName: "Retired category",
            deletedAt: expect.any(Date),
          }),
        ])
      })
    })
  })
})
