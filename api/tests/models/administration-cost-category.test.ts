import { UniqueConstraintError } from "@sequelize/core"

import { AdministrationCostCategory } from "@/models"
import {
  childCareCategoryFactory,
  administrationCostCategoryFactory,
  fundingPeriodFactory,
} from "@/factories"

describe("api/src/models/administration-cost-category.ts", () => {
  describe("AdministrationCostCategory", () => {
    describe("#validateSharedCategory", () => {
      test("when the shared category belongs to another funding period, rejects the configuration", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategory = await childCareCategoryFactory.create()

        // Act
        const creation = AdministrationCostCategory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "70.0000",
        })

        // Assert
        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })

      test("when an existing configuration is relinked, rejects changing its shared category", async () => {
        // Arrange
        const category = await administrationCostCategoryFactory.create()
        const childCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })

        // Act
        const update = category.update({ childCareCategoryId: childCareCategory.id })

        // Assert
        await expect(update).rejects.toThrow(
          "Child Care category and funding period cannot be changed"
        )
      })

      test("when a shared category is already configured, rejects a duplicate program rate", async () => {
        // Arrange
        const category = await administrationCostCategoryFactory.create()

        // Act & Assert
        await expect(
          AdministrationCostCategory.create({
            fundingPeriodId: category.fundingPeriodId,
            childCareCategoryId: category.childCareCategoryId,
            monthlyAmount: "80.0000",
          })
        ).rejects.toThrow(UniqueConstraintError)
      })

      test("when the shared category is retired, rejects the configuration", async () => {
        // Arrange
        const childCareCategory = await childCareCategoryFactory.create()
        await childCareCategory.destroy()

        // Act
        const creation = AdministrationCostCategory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "70.0000",
        })

        // Assert
        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })
    })
  })
})
