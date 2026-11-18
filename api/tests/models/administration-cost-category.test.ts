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
      test("rejects a shared category from another funding period", async () => {
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategory = await childCareCategoryFactory.create()

        const creation = AdministrationCostCategory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategory.id,
          monthlyAmount: "70.0000",
        })

        await expect(creation).rejects.toThrow(
          "Child Care category must be active in the same funding period"
        )
      })

      test("rejects relinking an existing program configuration", async () => {
        const category = await administrationCostCategoryFactory.create()
        const childCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })

        const update = category.update({ childCareCategoryId: childCareCategory.id })

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

      test("rejects a retired shared category", async () => {
        const childCareCategory = await childCareCategoryFactory.create()
        await childCareCategory.destroy()

        const creation = AdministrationCostCategory.create({
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
