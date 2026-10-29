import { ValidationError } from "@sequelize/core"

import {
  administrationCostCategoryFactory,
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
} from "@/factories"

import AdministrationCostCategory from "@/models/administration-cost-category"

describe("api/src/models/administration-cost-category.ts", () => {
  describe("AdministrationCostCategory", () => {
    describe("#validateChildCareSpaceCategory", () => {
      test("when a linked Spaces category belongs to another funding period, rejects creation", async () => {
        // Arrange
        const fundingPeriod1 = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fundingPeriod2 = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const childCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({
            fundingPeriod: fundingPeriod1,
          })
          .create()

        // Act
        const creation = AdministrationCostCategory.create({
          fundingPeriodId: fundingPeriod2.id,
          childCareSpaceCategoryId: childCareSpaceCategory.id,
          categoryName: "Infants",
          fromAge: null,
          toAge: null,
          monthlyAmount: "70.0000",
        })

        // Assert
        await expect(creation).rejects.toThrow(ValidationError)
      })

      test("when a linked Spaces category has been retired, rejects relinking an Administration category", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const childCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create()
        const administrationCostCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            childCareSpaceCategoryId: null,
          })
        await childCareSpaceCategory.destroy()

        // Act
        const update = administrationCostCategory.update({
          childCareSpaceCategoryId: childCareSpaceCategory.id,
        })

        // Assert
        await expect(update).rejects.toThrow(ValidationError)
      })
    })
  })
})
