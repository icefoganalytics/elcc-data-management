import { QualityEnhancementCategory } from "@/models"
import {
  childCareCategoryFactory,
  qualityEnhancementCategoryFactory,
  fundingPeriodFactory,
} from "@/factories"

describe("api/src/models/quality-enhancement-category.ts", () => {
  describe("QualityEnhancementCategory", () => {
    describe("#validateSharedCategory", () => {
      test("rejects a shared category from another funding period", async () => {
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategory = await childCareCategoryFactory.create()

        const creation = QualityEnhancementCategory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "70.0000",
        })

        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })

      test("rejects relinking an existing program configuration", async () => {
        const category = await qualityEnhancementCategoryFactory.create()
        const childCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })

        const update = category.update({ childCareCategoryId: childCareCategory.id })

        await expect(update).rejects.toThrow(
          "Child Care category and funding period cannot be changed"
        )
      })

      test("rejects configuring the same shared category twice", async () => {
        const category = await qualityEnhancementCategoryFactory.create()

        const creation = QualityEnhancementCategory.create({
          fundingPeriodId: category.fundingPeriodId,
          childCareCategoryId: category.childCareCategoryId,
          monthlyAmount: "80.0000",
        })

        await expect(creation).rejects.toThrow("already configured")
      })

      test("rejects a retired shared category", async () => {
        const childCareCategory = await childCareCategoryFactory.create()
        await childCareCategory.destroy()

        const creation = QualityEnhancementCategory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "70.0000",
        })

        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })
    })
  })
})
