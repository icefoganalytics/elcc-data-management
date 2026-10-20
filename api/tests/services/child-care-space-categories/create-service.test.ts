import { ChildCareSpace, ChildCareSpaceCategory, Centre, FiscalPeriod } from "@/models"

import { centreFactory, fiscalPeriodFactory, fundingPeriodFactory } from "@/factories"

import CreateService from "@/services/child-care-space-categories/create-service"

describe("api/src/services/child-care-space-categories/create-service.ts", () => {
  describe("CreateService", () => {
    describe(".perform", () => {
      test("when propagation is enabled, creates selected and later months for every non-deleted centre", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.APRIL,
          dateStart: new Date("2024-04-01"),
        })
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
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        await fiscalPeriodFactory.associations({ fundingPeriod: otherFundingPeriod }).create({
          fiscalYear: "2025-26",
          month: FiscalPeriod.Months.APRIL,
          dateStart: new Date("2025-04-01"),
        })
        const activeCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        const inactiveButNotDeletedCentre = await centreFactory.create({
          status: Centre.Statuses.INACTIVE,
        })
        const deletedCentre = await centreFactory.create({ status: Centre.Statuses.ACTIVE })
        await deletedCentre.destroy()

        // Act
        const category = await CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "125.5000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Assert
        const childCareSpaces = await ChildCareSpace.findAll()
        expect(childCareSpaces).toEqual([
          expect.objectContaining({
            centreId: activeCentre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: category.id,
            lineName: "Infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: activeCentre.id,
            fiscalPeriodId: juneFiscalPeriod.id,
            categoryId: category.id,
            lineName: "Infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: inactiveButNotDeletedCentre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: category.id,
            lineName: "Infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
          expect.objectContaining({
            centreId: inactiveButNotDeletedCentre.id,
            fiscalPeriodId: juneFiscalPeriod.id,
            categoryId: category.id,
            lineName: "Infants",
            monthlyAmount: "125.5",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when propagation is not enabled, creates no ledger snapshots", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.MAY,
          dateStart: new Date("2024-05-01"),
        })
        await centreFactory.create({ status: Centre.Statuses.ACTIVE })

        // Act
        await CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
          monthlyAmount: "100.0000",
        })

        // Assert
        const childCareSpaces = await ChildCareSpace.findAll()
        expect(childCareSpaces).toEqual([])
      })

      test("when propagation is enabled without a starting month, rejects the category creation", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })

        // Act
        const createPromise = CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "100.0000",
          applyToFutureMonths: true,
        })

        // Assert
        await expect(createPromise).rejects.toThrow(
          "Propagation start fiscal period ID must be a non-negative integer"
        )
      })

      test("when propagation is enabled without a starting month, rolls back category creation", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })

        // Act
        await CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "100.0000",
          applyToFutureMonths: true,
        }).catch(() => undefined)

        // Assert
        const persistedCategories = await ChildCareSpaceCategory.findAll()
        expect(persistedCategories).toEqual([])
      })

      test("when a category amount exceeds storage precision, rejects category creation", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })

        // Act
        const createPromise = CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "0.12345",
        })

        // Assert
        await expect(createPromise).rejects.toThrow(
          "Child Care Space category monthly amounts support at most four decimal places"
        )
      })
    })
  })
})
