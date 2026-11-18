import { ChildCareCategory } from "@/models"
import { childCareCategoryFactory, fundingPeriodFactory } from "@/factories"
import BulkEnsureService from "@/services/funding-periods/child-care-categories/bulk-ensure-service"

describe("api/src/services/funding-periods/child-care-categories/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when the catalogue was deliberately retired, does not revive it", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const category = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
        })
        await category.destroy()

        // Act
        await BulkEnsureService.perform(fundingPeriod)

        // Assert
        const activeCategories = await ChildCareCategory.findAll({
          where: { fundingPeriodId: fundingPeriod.id },
        })

        expect(activeCategories).toEqual([])
      })

      test("when the latest earlier catalogue is empty, clones it instead of reviving an older year", async () => {
        // Arrange
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const latestFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        await childCareCategoryFactory.create({ fundingPeriodId: olderFundingPeriod.id })
        const retiredCategory = await childCareCategoryFactory.create({
          fundingPeriodId: latestFundingPeriod.id,
        })
        await retiredCategory.destroy()

        // Act
        await BulkEnsureService.perform(targetFundingPeriod)

        // Assert
        const categories = await ChildCareCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })

        expect(categories).toEqual([])
      })
    })
  })
})
