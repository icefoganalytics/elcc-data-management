import { ChildCareSpace, ChildCareSpaceCategory, Centre, FiscalPeriod } from "@/models"

import {
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import UpdateService from "@/services/child-care-space-categories/update-service"

describe("api/src/services/child-care-space-categories/update-service.ts", () => {
  describe("UpdateService", () => {
    describe(".perform", () => {
      test("when propagation is enabled, reprices selected and later snapshots while retaining estimates", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const juneFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.JUNE,
          dateStart: new Date("2024-06-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const centre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const maySpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.6000",
            actualChildOccupancyRate: "0.0000",
          })
        const juneSpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: juneFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.1234",
            actualChildOccupancyRate: "0.0000",
          })

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll()
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: maySpace.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0.6",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "75.3",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            id: juneSpace.id,
            fiscalPeriodId: juneFiscalPeriod.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0.1234",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "15.4867",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when propagated rows have actual occupancy or manual snapshot overrides, preserves their values", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const actualCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const manualNameCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const manualAmountCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const actualSpace = await childCareSpaceFactory
          .associations({ centre: actualCentre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.7000",
            actualChildOccupancyRate: "0.2000",
          })
        const manualNameSpace = await childCareSpaceFactory
          .associations({ centre: manualNameCentre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            lineName: "Manual cohort name",
            estimatedChildOccupancyRate: "0.3000",
            actualChildOccupancyRate: "0.0000",
          })
        const manualAmountSpace = await childCareSpaceFactory
          .associations({ centre: manualAmountCentre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            monthlyAmount: "105.0000",
            estimatedChildOccupancyRate: "0.2000",
            actualChildOccupancyRate: "0.0000",
          })

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll()
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: actualSpace.id,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.7",
            actualChildOccupancyRate: "0.2",
            estimatedComputedTotal: "70",
            actualComputedTotal: "20",
          }),
          expect.objectContaining({
            id: manualNameSpace.id,
            lineName: "Manual cohort name",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.3",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "30",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            id: manualAmountSpace.id,
            lineName: "Infants",
            monthlyAmount: "105",
            estimatedChildOccupancyRate: "0.2",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "21",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when propagation starts after an existing month, keeps earlier snapshots unchanged", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const aprilFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.APRIL,
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const centre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const aprilSpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: aprilFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.4000",
            actualChildOccupancyRate: "0.0000",
          })
        const maySpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.0000",
          })

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll()
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: aprilSpace.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedComputedTotal: "40",
          }),
          expect.objectContaining({
            id: maySpace.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedComputedTotal: "62.75",
          }),
        ])
      })

      test("when propagation is enabled, fills missing centre-month pairs with the updated category snapshot", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const juneFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.JUNE,
          dateStart: new Date("2024-06-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const firstCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const secondCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const firstCentreMaySpace = await childCareSpaceFactory
          .associations({ centre: firstCentre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.4000",
            actualChildOccupancyRate: "0.0000",
          })
        const secondCentreJuneSpace = await childCareSpaceFactory
          .associations({ centre: secondCentre, fiscalPeriod: juneFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.0000",
          })

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll()
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: firstCentreMaySpace.id,
            centreId: firstCentre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedComputedTotal: "50.2",
          }),
          expect.objectContaining({
            id: secondCentreJuneSpace.id,
            centreId: secondCentre.id,
            fiscalPeriodId: juneFiscalPeriod.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedComputedTotal: "62.75",
          }),
          expect.objectContaining({
            centreId: firstCentre.id,
            fiscalPeriodId: juneFiscalPeriod.id,
            categoryId: category.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: secondCentre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: category.id,
            lineName: "Updated infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when propagation is explicitly disabled, retains month snapshots and creates no missing pairs", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const juneFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.JUNE,
          dateStart: new Date("2024-06-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const centre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const maySpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.0000",
          })

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: false,
          propagationStartFiscalPeriodId: juneFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll()
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: maySpace.id,
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedComputedTotal: "50",
          }),
        ])
      })

      test("when the starting month belongs to another funding period, rejects the update", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const otherFundingPeriodFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create({
            fiscalYear: "2025-26",
            month: FiscalPeriod.Months.MAY,
            dateStart: new Date("2025-05-01"),
          })

        // Act
        const updatePromise = UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: otherFundingPeriodFiscalPeriod.id,
        })

        // Assert
        await expect(updatePromise).rejects.toThrow(
          "Propagation start fiscal period was not found in the category funding period"
        )
      })

      test("when the starting month belongs to another funding period, rolls back the category update", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const otherFundingPeriodFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create({
            fiscalYear: "2025-26",
            month: FiscalPeriod.Months.MAY,
            dateStart: new Date("2025-05-01"),
          })

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: otherFundingPeriodFiscalPeriod.id,
        }).catch(() => undefined)

        // Assert
        const persistedCategory = await ChildCareSpaceCategory.findByPk(category.id)
        expect(persistedCategory).toEqual(
          expect.objectContaining({
            categoryName: "Infants",
            monthlyAmount: "100",
          })
        )
      })

      test("when a centre has been soft-deleted, preserves its existing ledger snapshots", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const deletedCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const childCareSpace = await childCareSpaceFactory
          .associations({ centre: deletedCentre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.6000",
            actualChildOccupancyRate: "0.0000",
          })
        await deletedCentre.destroy()

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll()
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: childCareSpace.id,
            centreId: deletedCentre.id,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.6",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "60",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when a category-month pair was soft-deleted, does not create a replacement pair", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "100.0000" })
        const centre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const softDeletedSpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.0000",
          })
        await softDeletedSpace.destroy()

        // Act
        await UpdateService.perform(category, {
          categoryName: "Updated infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const persistedSpaces = await ChildCareSpace.findAll({ paranoid: false })
        expect(persistedSpaces).toEqual([
          expect.objectContaining({
            id: softDeletedSpace.id,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedComputedTotal: "10",
            deletedAt: expect.any(Date),
          }),
        ])
      })
    })
  })
})
