import { childCareCategoryFactory, fundingPeriodFactory } from "@/factories"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import CreateService from "@/services/quality-enhancement-categories/create-service"

describe("api/src/services/quality-enhancement-categories/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("persists the selected shared category identity", async () => {
        const childCareCategory = await childCareCategoryFactory.create()

        await CreateService.perform({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "206.1000",
        })

        const categories = await QualityEnhancementCategory.findAll()
        expect(categories).toEqual([
          expect.objectContaining({ childCareCategoryId: childCareCategory.id }),
        ])
      })

      test("rejects a shared category from another funding period", async () => {
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategory = await childCareCategoryFactory.create()

        const creation = CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "100.0000",
        })

        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })
    })
  })
})
