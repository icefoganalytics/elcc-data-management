import { AdministrationCost, AdministrationCostCategory, ChildCareSpace } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import { DestroyService } from "@/services/funding-periods/destroy-service"

describe("api/src/services/funding-periods/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when deleting a funding period, preserves child care spaces from other periods", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const selectedFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const unrelatedFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const selectedFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: selectedFundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const unrelatedFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: unrelatedFundingPeriod.id,
          fiscalYear: "2025-26",
        })
        const selectedCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: selectedFundingPeriod.id,
          categoryName: "Selected",
        })
        const unrelatedCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: unrelatedFundingPeriod.id,
          categoryName: "Unrelated",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: selectedFiscalPeriod,
            category: selectedCategory,
          })
          .create()
        const unrelatedChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: unrelatedFiscalPeriod,
            category: unrelatedCategory,
          })
          .create()

        // Act
        await DestroyService.perform(selectedFundingPeriod)

        // Act
        const remainingChildCareSpaces = await ChildCareSpace.findAll()

        // Assert
        expect(remainingChildCareSpaces).toEqual([
          expect.objectContaining({
            id: unrelatedChildCareSpace.id,
            deletedAt: null,
          }),
        ])
      })

      test("when deleting a funding period, removes only its administration configuration and ledger", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const selectedFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const unrelatedFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const selectedFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: selectedFundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const unrelatedFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: unrelatedFundingPeriod.id,
          fiscalYear: "2025-26",
        })
        const selectedCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod: selectedFundingPeriod,
          })
          .create()
        const unrelatedCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod: unrelatedFundingPeriod,
          })
          .create()
        await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: selectedFiscalPeriod,
            category: selectedCategory,
          })
          .create()
        await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: unrelatedFiscalPeriod,
            category: unrelatedCategory,
          })
          .create()

        // Act
        await DestroyService.perform(selectedFundingPeriod)

        // Assert
        const remainingAdministrationCosts = await AdministrationCost.findAll()
        const remainingAdministrationCostCategories = await AdministrationCostCategory.findAll()
        expect(remainingAdministrationCosts).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: unrelatedFiscalPeriod.id,
            categoryId: unrelatedCategory.id,
          }),
        ])
        expect(remainingAdministrationCostCategories).toEqual([
          expect.objectContaining({
            id: unrelatedCategory.id,
            fundingPeriodId: unrelatedFundingPeriod.id,
          }),
        ])
      })
    })
  })
})
