import { ChildCareCategory } from "@/models"
import {
  childCareCategoryFactory,
  childCareSpaceCategoryFactory,
  administrationCostCategoryFactory,
  qualityEnhancementCategoryFactory,
} from "@/factories"
import DestroyService from "@/services/child-care-categories/destroy-service"

describe("api/src/services/child-care-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("rejects retirement while child-care-space is configured", async () => {
        const childCareCategory = await childCareCategoryFactory.create()
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })

        const retirement = DestroyService.perform(childCareCategory)

        await expect(retirement).rejects.toThrow(
          "Cannot delete a Child Care category with active program configurations"
        )
      })

      test("rejects retirement while administration-cost is configured", async () => {
        const childCareCategory = await childCareCategoryFactory.create()
        await administrationCostCategoryFactory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })

        const retirement = DestroyService.perform(childCareCategory)

        await expect(retirement).rejects.toThrow(
          "Cannot delete a Child Care category with active program configurations"
        )
      })

      test("rejects retirement while quality-enhancement is configured", async () => {
        const childCareCategory = await childCareCategoryFactory.create()
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })

        const retirement = DestroyService.perform(childCareCategory)

        await expect(retirement).rejects.toThrow(
          "Cannot delete a Child Care category with active program configurations"
        )
      })

      test("retires an unconfigured shared category", async () => {
        const childCareCategory = await childCareCategoryFactory.create()

        await DestroyService.perform(childCareCategory)
        const activeCategory = await ChildCareCategory.findByPk(childCareCategory.id)

        expect(activeCategory).toBeNull()
      })
    })
  })
})
