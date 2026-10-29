import { AdministrationCost } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  childCareSpaceCategoryFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import BulkEnsureService from "@/services/centres/funding-periods/administration-costs/bulk-ensure-service"

describe("api/src/services/centres/funding-periods/administration-costs/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when a centre is first provisioned, creates snapshots for each period and category", async () => {
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
        const childCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Infants",
          })
        const linkedCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
            childCareSpaceCategory,
          })
          .create({
            categoryName: "Infants",
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            monthlyAmount: "80.0000",
          })
        const unlinkedCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Other care",
            monthlyAmount: "50.0000",
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod, true)

        // Assert
        const administrationCosts = await AdministrationCost.findAll()
        expect(administrationCosts).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            categoryId: linkedCategory.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            lineName: "Infants",
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            categoryId: unlinkedCategory.id,
            childCareSpaceCategoryId: null,
            lineName: "Other care",
            monthlyAmount: "50",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: linkedCategory.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            lineName: "Infants",
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: unlinkedCategory.id,
            childCareSpaceCategoryId: null,
            lineName: "Other care",
            monthlyAmount: "50",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when a centre already has monthly ledger history, preserves missing periods", async () => {
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
            fiscalYear: "2024-25",
            dateStart: new Date("2024-04-01"),
          })
        await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            dateStart: new Date("2024-05-01"),
          })
        const category = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Infants",
          })
        const existingAdministrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category,
          })
          .create({
            estimatedChildOccupancyRate: "0.2500",
            actualChildOccupancyRate: "0.0000",
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod, true)

        // Assert
        const persistedAdministrationCosts = await AdministrationCost.findAll()
        expect(persistedAdministrationCosts).toEqual([
          expect.objectContaining({
            id: existingAdministrationCost.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            categoryId: category.id,
            estimatedChildOccupancyRate: "0.25",
            actualChildOccupancyRate: "0",
          }),
        ])
      })
    })
  })
})
