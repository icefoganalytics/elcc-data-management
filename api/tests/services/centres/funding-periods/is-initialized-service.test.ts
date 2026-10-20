import { FiscalPeriod } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  buildingExpenseFactory,
  centreFactory,
  employeeBenefitFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingReconciliationFactory,
  fundingSubmissionLineJsonFactory,
} from "@/factories"

import CreateCategoryService from "@/services/child-care-space-categories/create-service"
import IsInitializedService from "@/services/centres/funding-periods/is-initialized-service"

describe("api/src/services/centres/funding-periods/is-initialized-service.ts", () => {
  describe("IsInitializedService", () => {
    describe("#perform", () => {
      test("when Administration has no rows and a Spaces category is added, keeps initialized worksheets accessible", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.APRIL,
          dateStart: new Date("2024-04-01"),
        })
        await employeeBenefitFactory.associations({ centre, fiscalPeriod }).create()
        await buildingExpenseFactory.associations({ centre, fiscalPeriod }).create()
        await fundingSubmissionLineJsonFactory.associations({ centre }).create({
          fiscalYear: "2024/25",
        })
        await fundingReconciliationFactory.associations({ centre, fundingPeriod }).create()
        await CreateCategoryService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "New category",
          monthlyAmount: "100.0000",
        })

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus).toEqual({
          hasEmployeeBenefits: true,
          hasBuildingExpenses: true,
          hasFundingSubmissionLineJsons: true,
          hasFundingReconciliation: true,
          hasAdministrationCosts: false,
          isInitialized: true,
        })
      })

      test("when a category starts in May, keeps worksheets accessible without requiring an April row", async () => {
        // Arrange
        const centre = await centreFactory.create()
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
        await employeeBenefitFactory
          .associations({ centre, fiscalPeriod: aprilFiscalPeriod })
          .create()
        await buildingExpenseFactory
          .associations({ centre, fiscalPeriod: aprilFiscalPeriod })
          .create()
        await fundingSubmissionLineJsonFactory.associations({ centre }).create({
          fiscalYear: "2024/25",
        })
        await fundingReconciliationFactory.associations({ centre, fundingPeriod }).create()
        const administrationCostCategory = await administrationCostCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category: administrationCostCategory,
          })
          .create()
        await CreateCategoryService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "May category",
          monthlyAmount: "100.0000",
          applyToFutureMonths: true,
          propagationStartFiscalPeriodId: mayFiscalPeriod.id,
        })

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus).toEqual({
          hasEmployeeBenefits: true,
          hasBuildingExpenses: true,
          hasFundingSubmissionLineJsons: true,
          hasFundingReconciliation: true,
          isInitialized: true,
          hasAdministrationCosts: true,
        })
      })
    })
  })
})
