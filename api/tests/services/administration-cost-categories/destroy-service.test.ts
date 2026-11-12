import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  fiscalPeriodFactory,
} from "@/factories"

import DestroyService from "@/services/administration-cost-categories/destroy-service"

describe("api/src/services/administration-cost-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when a category has active monthly records, rejects retirement", async () => {
        // Arrange
        const category = await administrationCostCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await administrationCostFactory.associations({ category, fiscalPeriod }).create()

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Administration Cost records"
        )
      })

      test("when only another category has active records, retires the unused category", async () => {
        // Arrange
        const category = await administrationCostCategoryFactory.create()
        await administrationCostFactory.create()

        // Act
        await DestroyService.perform(category)
        await category.reload({ paranoid: false })

        // Assert
        expect(category.deletedAt).toBeInstanceOf(Date)
      })

      test("when all records using a category have been deleted, allows retirement", async () => {
        // Arrange
        const category = await administrationCostCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        const administrationCost = await administrationCostFactory
          .associations({ category, fiscalPeriod })
          .create()
        await administrationCost.destroy()

        // Act
        await DestroyService.perform(category)
        await category.reload({ paranoid: false })

        // Assert
        expect(category.deletedAt).toBeInstanceOf(Date)
      })
    })
  })
})
