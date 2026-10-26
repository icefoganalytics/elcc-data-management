import { AdministrationCost } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"
import ReplicateEstimatesService from "@/services/administration-costs/replicate-estimates-service"

describe("api/src/services/administration-costs/replicate-estimates-service.ts", () => {
  describe("ReplicateEstimatesService", () => {
    describe("#perform", () => {
      test("when later periods have matching rows, copies only the same centre and category estimates", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const otherCentre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            dateStart: new Date("2024-04-01"),
          })
        const mayFiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            dateStart: new Date("2024-05-01"),
          })
        const infantsCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Infants",
            monthlyAmount: "80.0000",
          })
        const toddlersCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Toddlers",
            monthlyAmount: "120.0000",
          })
        const sourceAdministrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category: infantsCategory,
          })
          .create({
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.7500",
          })
        const laterAdministrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category: infantsCategory,
          })
          .create({
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.5000",
          })
        const laterOtherCategoryCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category: toddlersCategory,
          })
          .create({
            estimatedChildOccupancyRate: "0.2500",
            actualChildOccupancyRate: "0.3000",
          })
        const laterOtherCentreCost = await administrationCostFactory
          .associations({
            centre: otherCentre,
            fiscalPeriod: mayFiscalPeriod,
            category: infantsCategory,
          })
          .create({
            estimatedChildOccupancyRate: "0.4000",
            actualChildOccupancyRate: "0.6000",
          })

        // Act
        await ReplicateEstimatesService.perform(sourceAdministrationCost)

        // Assert
        const administrationCosts = await AdministrationCost.findAll()
        expect(administrationCosts).toEqual([
          expect.objectContaining({
            id: sourceAdministrationCost.id,
            estimatedChildOccupancyRate: "0.8",
            actualChildOccupancyRate: "0.75",
            estimatedComputedTotal: "64",
            actualComputedTotal: "60",
          }),
          expect.objectContaining({
            id: laterAdministrationCost.id,
            estimatedChildOccupancyRate: "0.8",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "64",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            id: laterOtherCategoryCost.id,
            estimatedChildOccupancyRate: "0.25",
            actualChildOccupancyRate: "0.3",
            estimatedComputedTotal: "30",
            actualComputedTotal: "36",
          }),
          expect.objectContaining({
            id: laterOtherCentreCost.id,
            estimatedChildOccupancyRate: "0.4",
            actualChildOccupancyRate: "0.6",
            estimatedComputedTotal: "32",
            actualComputedTotal: "48",
          }),
        ])
      })

      test("when a later month is missing its row, rolls back earlier replicated changes", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            dateStart: new Date("2024-04-01"),
          })
        const mayFiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            dateStart: new Date("2024-05-01"),
          })
        await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            dateStart: new Date("2024-06-01"),
          })
        const category = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Infants",
            monthlyAmount: "80.0000",
          })
        const sourceAdministrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category,
          })
          .create({
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.7500",
          })
        const mayAdministrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category,
          })
          .create({
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.5000",
          })

        // Act / Assert
        await expect(ReplicateEstimatesService.perform(sourceAdministrationCost)).rejects.toThrow(
          Error
        )
        await mayAdministrationCost.reload()
        expect(mayAdministrationCost).toEqual(
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.1",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "8",
            actualComputedTotal: "40",
          })
        )
      })
    })
  })
})
