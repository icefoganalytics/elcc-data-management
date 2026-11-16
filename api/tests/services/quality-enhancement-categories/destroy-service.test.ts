import { QualityEnhancementCategory } from "@/models"

import {
  fiscalPeriodFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"

import DestroyService from "@/services/quality-enhancement-categories/destroy-service"

describe("api/src/services/quality-enhancement-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when a category has active monthly records, rejects retirement", async () => {
        // Arrange
        const category = await qualityEnhancementCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await qualityEnhancementFactory
          .associations({
            category,
            fiscalPeriod,
          })
          .create()

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Quality Enhancement records"
        )
      })

      test("when only another category has active records, retires the unused category", async () => {
        // Arrange
        const category = await qualityEnhancementCategoryFactory.create()
        await qualityEnhancementFactory.create()

        // Act
        await DestroyService.perform(category)

        // Assert
        const retiredCategory = await QualityEnhancementCategory.findByPk(category.id)
        expect(retiredCategory).toBeNull()
      })

      test("when all records using a category have been deleted, allows retirement", async () => {
        // Arrange
        const category = await qualityEnhancementCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        const qualityEnhancement = await qualityEnhancementFactory
          .associations({
            category,
            fiscalPeriod,
          })
          .create()
        await qualityEnhancement.destroy()

        // Act
        await DestroyService.perform(category)

        // Assert
        const retiredCategory = await QualityEnhancementCategory.findByPk(category.id)
        expect(retiredCategory).toBeNull()
      })
    })
  })
})
