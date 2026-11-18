import { ChildCareCategory } from "@/models"
import { childCareCategoryFactory, fundingPeriodFactory } from "@/factories"
import BulkEnsureService from "@/services/funding-periods/child-care-categories/bulk-ensure-service"

describe("api/src/services/funding-periods/child-care-categories/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("does not revive a deliberately retired catalogue", async () => {
        const fundingPeriod = await fundingPeriodFactory.create()
        const category = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
        })
        await category.destroy()

        await BulkEnsureService.perform(fundingPeriod)
        const activeCategories = await ChildCareCategory.findAll({
          where: { fundingPeriodId: fundingPeriod.id },
        })

        expect(activeCategories).toEqual([])
      })

      test("clones the latest earlier empty catalogue instead of reviving an older year", async () => {
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const latestFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        await childCareCategoryFactory.create({ fundingPeriodId: olderFundingPeriod.id })
        const retiredCategory = await childCareCategoryFactory.create({
          fundingPeriodId: latestFundingPeriod.id,
        })
        await retiredCategory.destroy()

        await BulkEnsureService.perform(targetFundingPeriod)
        const categories = await ChildCareCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })

        expect(categories).toEqual([])
      })
    })
  })
})
