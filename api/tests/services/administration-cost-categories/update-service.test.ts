import { AdministrationCost, FiscalPeriod } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  childCareSpaceCategoryFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import UpdateService from "@/services/administration-cost-categories/update-service"

describe("api/src/services/administration-cost-categories/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test("when category configuration changes, preserves existing ledger snapshots", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.APRIL,
          dateStart: new Date("2024-04-01"),
          dateEnd: new Date("2024-04-30"),
        })
        const childCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const administrationCostCategory = await administrationCostCategoryFactory
          .associations({ fundingPeriod, childCareSpaceCategory })
          .create({
            categoryName: "Infants",
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            monthlyAmount: "70.0000",
          })
        const administrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod,
            category: administrationCostCategory,
            childCareSpaceCategory,
          })
          .create({
            lineName: "Infants",
            monthlyAmount: "70.0000",
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })

        // Act
        await UpdateService.perform(administrationCostCategory, {
          categoryName: "Young children",
          monthlyAmount: "99.0000",
          childCareSpaceCategoryId: null,
        })

        // Assert
        const persistedAdministrationCosts = await AdministrationCost.findAll()
        expect(persistedAdministrationCosts).toEqual([
          expect.objectContaining({
            id: administrationCost.id,
            categoryId: administrationCostCategory.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            lineName: "Infants",
            monthlyAmount: "70",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "35",
            actualComputedTotal: "17.5",
          }),
        ])
      })

      test("when category monthly amount has excess precision, rejects the update", async () => {
        // Arrange
        const administrationCostCategory = await administrationCostCategoryFactory.create()

        // Act
        const updatePromise = administrationCostCategory.update({ monthlyAmount: "70.12345" })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })
    })
  })
})
