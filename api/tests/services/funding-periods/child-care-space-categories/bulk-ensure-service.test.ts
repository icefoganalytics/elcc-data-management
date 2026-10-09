import { ChildCareSpaceCategory } from "@/models"

import { childCareSpaceCategoryFactory, fundingPeriodFactory } from "@/factories"
import { BulkEnsureService } from "@/services/funding-periods/child-care-space-categories/bulk-ensure-service"

describe("api/src/services/funding-periods/child-care-space-categories/bulk-ensure-service.ts", () => {
  describe("#perform", () => {
    test("when all categories have been deleted, preserves the deliberate empty configuration", async () => {
      // Arrange
      const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
      const deletedCategory = await childCareSpaceCategoryFactory
        .associations({ fundingPeriod })
        .create({ categoryName: "Retired category" })
      await deletedCategory.destroy()

      // Act
      const firstResult = await BulkEnsureService.perform(fundingPeriod)
      const secondResult = await BulkEnsureService.perform(fundingPeriod)

      // Assert
      const historicalCategories = await ChildCareSpaceCategory.findAll({
        where: { fundingPeriodId: fundingPeriod.id },
        paranoid: false,
        order: [["id", "ASC"]],
      })
      expect({ firstResult, secondResult, historicalCategories }).toEqual({
        firstResult: [],
        secondResult: [],
        historicalCategories: [
          expect.objectContaining({
            id: deletedCategory.id,
            categoryName: "Retired category",
            deletedAt: expect.any(Date),
          }),
        ],
      })
    })
  })
})
