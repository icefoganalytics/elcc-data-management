import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"

import DestroyService from "@/services/child-care-space-categories/destroy-service"

describe("api/src/services/child-care-space-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when a category has active monthly spaces, rejects retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await childCareSpaceFactory.associations({ category, fiscalPeriod }).create()

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Child Care Space records"
        )
      })

      test("when an Administration Cost category references the category, rejects retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        await administrationCostCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
          childCareSpaceCategoryId: category.id,
        })

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Administration Cost categories"
        )
      })

      test("when a Quality Enhancement category references the category, rejects retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
          childCareSpaceCategoryId: category.id,
        })

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Quality Enhancement categories"
        )
      })

      test("when a monthly Administration Cost retains a category link, rejects retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await administrationCostFactory
          .associations({ fiscalPeriod })
          .create({ childCareSpaceCategoryId: category.id })

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Administration Cost records"
        )
      })

      test("when a monthly Quality Enhancement retains a category link, rejects retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await qualityEnhancementFactory
          .associations({ fiscalPeriod })
          .create({ childCareSpaceCategoryId: category.id })

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Quality Enhancement records"
        )
      })

      test("when a funding submission line references the category, rejects retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        await fundingSubmissionLineFactory.create({ childCareSpaceCategoryId: category.id })

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by funding submission lines"
        )
      })

      test("when only another category has active records, retires the unused category", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        await childCareSpaceFactory.create()

        // Act
        await DestroyService.perform(category)
        await category.reload({ paranoid: false })

        // Assert
        expect(category.deletedAt).toBeInstanceOf(Date)
      })

      test("when all dependent records and categories have been deleted, allows retirement", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        const childCareSpace = await childCareSpaceFactory
          .associations({ category, fiscalPeriod })
          .create()
        const administrationCostCategory = await administrationCostCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
          childCareSpaceCategoryId: category.id,
        })
        const qualityEnhancementCategory = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
          childCareSpaceCategoryId: category.id,
        })
        const administrationCost = await administrationCostFactory
          .associations({ category: administrationCostCategory, fiscalPeriod })
          .create()
        const qualityEnhancement = await qualityEnhancementFactory
          .associations({ category: qualityEnhancementCategory, fiscalPeriod })
          .create()
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          childCareSpaceCategoryId: category.id,
        })
        await childCareSpace.destroy()
        await administrationCost.destroy()
        await qualityEnhancement.destroy()
        await fundingSubmissionLine.destroy()
        await administrationCostCategory.destroy()
        await qualityEnhancementCategory.destroy()

        // Act
        await DestroyService.perform(category)
        await category.reload({ paranoid: false })

        // Assert
        expect(category.deletedAt).toBeInstanceOf(Date)
      })
    })
  })
})
