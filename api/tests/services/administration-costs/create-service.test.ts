import { AdministrationCost } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"
import CreateService from "@/services/administration-costs/create-service"
import DestroyService from "@/services/administration-costs/destroy-service"

describe("api/src/services/administration-costs/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when forward creation is requested, uses dates within the funding period and preserves existing rows", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const may = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-05-01"),
        })
        const april = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-04-01"),
        })
        const june = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-06-01"),
        })
        await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-03-01"),
        })
        await fiscalPeriodFactory.create({
          fiscalYear: "2027-28",
          dateStart: new Date("2027-04-01"),
        })
        const category = await administrationCostCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Historical administration", monthlyAmount: "80.0000" })
        const existingJuneCost = await administrationCostFactory
          .associations({ centre, fiscalPeriod: june, category })
          .create({
            lineName: "Existing June snapshot",
            monthlyAmount: "90.0000",
            estimatedChildOccupancyRate: "0.9000",
            actualChildOccupancyRate: "0.3000",
          })

        // Act
        await CreateService.perform({
          centreId: centre.id,
          fiscalPeriodId: april.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
          applyToCurrentAndFutureFiscalPeriods: true,
        })

        // Assert
        const costs = await AdministrationCost.findAll({
          where: { centreId: centre.id },
          order: [["fiscalPeriodId", "ASC"]],
        })
        expect(costs).toEqual([
          expect.objectContaining({
            fiscalPeriodId: may.id,
            categoryId: category.id,
            lineName: "Historical administration",
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "40",
            actualComputedTotal: "20",
          }),
          expect.objectContaining({
            fiscalPeriodId: april.id,
            categoryId: category.id,
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
          }),
          expect.objectContaining({
            id: existingJuneCost.id,
            fiscalPeriodId: june.id,
            lineName: "Existing June snapshot",
            monthlyAmount: "90",
            estimatedChildOccupancyRate: "0.9",
            actualChildOccupancyRate: "0.3",
          }),
        ])
      })

      test("when a row was explicitly deleted, permits adding its category back without restoring the old snapshot", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const category = await administrationCostCategoryFactory
          .associations({ fundingPeriod })
          .create({ monthlyAmount: "80.0000" })
        const oldCost = await administrationCostFactory
          .associations({ fiscalPeriod, category })
          .create({ monthlyAmount: "70.0000", estimatedChildOccupancyRate: "0.8000" })
        await DestroyService.perform(oldCost)

        // Act
        await CreateService.perform({
          centreId: oldCost.centreId,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Assert
        const costs = await AdministrationCost.findAll({
          where: { centreId: oldCost.centreId },
          paranoid: false,
          order: [["id", "ASC"]],
        })
        expect(costs).toEqual([
          expect.objectContaining({
            id: oldCost.id,
            monthlyAmount: "70",
            estimatedChildOccupancyRate: "0.8",
            deletedAt: expect.any(Date),
          }),
          expect.objectContaining({
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "40",
            actualComputedTotal: "20",
            deletedAt: null,
          }),
        ])
      })
    })
  })
})
