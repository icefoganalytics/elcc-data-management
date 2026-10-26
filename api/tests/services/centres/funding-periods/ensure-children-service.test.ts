import {
  AdministrationCost,
  BuildingExpense,
  ChildCareSpace,
  EmployeeBenefit,
  FundingReconciliation,
  FundingSubmissionLineJson,
} from "@/models"

import {
  administrationCostCategoryFactory,
  buildingExpenseCategoryFactory,
  buildingExpenseFactory,
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  employeeBenefitFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingReconciliationFactory,
  fundingRegionFactory,
  fundingSubmissionLineFactory,
  fundingSubmissionLineJsonFactory,
} from "@/factories"

import EnsureChildrenService from "@/services/centres/funding-periods/ensure-children-service"

describe("api/src/services/centres/funding-periods/ensure-children-service.ts", () => {
  describe("EnsureChildrenService", () => {
    describe("#perform", () => {
      test("when centre has no employee benefits, creates an employee benefit per fiscal period", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const employeeBenefits = await EmployeeBenefit.findAll()
        expect(employeeBenefits).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
          }),
        ])
      })

      test("when centre has employee benefits, does not create duplicate employee benefits", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const employeeBenefit = await employeeBenefitFactory.create({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const employeeBenefits = await EmployeeBenefit.findAll()
        expect(employeeBenefits).toEqual([
          expect.objectContaining({
            id: employeeBenefit.id,
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
          }),
        ])
      })

      test("when centre has no building expenses, creates building expenses per building expense category", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        const buildingExpenseCategory = await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const buildingExpenses = await BuildingExpense.findAll()
        expect(buildingExpenses).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: buildingExpenseCategory.id,
          }),
        ])
      })

      test("when centre has building expenses, does not create duplicate building expenses", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const buildingExpenseCategory = await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const buildingExpense = await buildingExpenseFactory.create({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: buildingExpenseCategory.id,
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const buildingExpenses = await BuildingExpense.findAll()
        expect(buildingExpenses).toEqual([
          expect.objectContaining({
            id: buildingExpense.id,
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: buildingExpenseCategory.id,
          }),
        ])
      })

      test("when centre has no funding submission line jsons, creates some funding submission line jsons", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const fundingSubmissionLineJsons = await FundingSubmissionLineJson.findAll()
        expect(fundingSubmissionLineJsons).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalYear: "2024/25",
          }),
        ])
      })

      test("when centre has funding submission line jsons, does not create duplicate funding submission line jsons", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const fundingSubmissionLineJson = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          fiscalYear: "2024/25",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const fundingSubmissionLineJsons = await FundingSubmissionLineJson.findAll()
        expect(fundingSubmissionLineJsons).toEqual([
          expect.objectContaining({
            id: fundingSubmissionLineJson.id,
            centreId: centre.id,
            fiscalYear: "2024/25",
          }),
        ])
      })

      test("when centre has no funding reconciliation, creates a funding reconciliation", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const fundingReconciliations = await FundingReconciliation.findAll()
        expect(fundingReconciliations).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fundingPeriodId: fundingPeriod.id,
          }),
        ])
      })

      test("when centre has funding reconciliation, does not create duplicate", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const fundingReconciliation = await fundingReconciliationFactory.create({
          centreId: centre.id,
          fundingPeriodId: fundingPeriod.id,
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const fundingReconciliations = await FundingReconciliation.findAll()
        expect(fundingReconciliations).toEqual([
          expect.objectContaining({
            id: fundingReconciliation.id,
            centreId: centre.id,
            fundingPeriodId: fundingPeriod.id,
          }),
        ])
      })

      test("when a centre and funding period are initialized, provisions configured categories across all months", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const childCareSpaces = await ChildCareSpace.findAll()
        expect(childCareSpaces).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            categoryId: category.id,
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: category.id,
          }),
        ])
      })

      test("when a category is added after initialization without propagation, leaves its months absent", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const originalCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        await EnsureChildrenService.perform(centre, fundingPeriod)
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const childCareSpaces = await ChildCareSpace.findAll()
        expect(childCareSpaces).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: originalCategory.id,
          }),
        ])
      })

      test("when a category is propagated from May, later shared ensures preserve the absent April pair", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })

        const mayFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        await EnsureChildrenService.perform(centre, fundingPeriod)
        const mayScopedCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })
        const mayChildCareSpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod, category: mayScopedCategory })
          .create()

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const childCareSpaces = await ChildCareSpace.findAll()
        expect(childCareSpaces).toEqual([
          expect.objectContaining({
            id: mayChildCareSpace.id,
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: mayScopedCategory.id,
          }),
        ])
      })

      test("when propagation precedes centre initialization, preserves the selected starting month", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({ fundingRegionId: fundingRegion.id })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const mayChildCareSpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod, category })
          .create()
        await fundingSubmissionLineFactory.create({ fiscalYear: "2024/25" })
        await buildingExpenseCategoryFactory.create({ fundingRegionId: fundingRegion.id })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const childCareSpaces = await ChildCareSpace.findAll()
        expect(childCareSpaces).toEqual([
          expect.objectContaining({
            id: mayChildCareSpace.id,
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: category.id,
          }),
        ])
      })

      test("when Spaces are propagated before initialization, provisions Administration snapshots for all months", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create()
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
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
        const administrationCostCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
            childCareSpaceCategory,
          })
          .create({
            categoryName: "Infants",
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            monthlyAmount: "80.0000",
          })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category: childCareSpaceCategory,
          })
          .create()
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
        })
        await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        await EnsureChildrenService.perform(centre, fundingPeriod)
        await EnsureChildrenService.perform(centre, fundingPeriod)

        // Assert
        const persistedAdministrationCosts = await AdministrationCost.findAll()
        expect(persistedAdministrationCosts).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            categoryId: administrationCostCategory.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            monthlyAmount: "80",
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: administrationCostCategory.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            monthlyAmount: "80",
          }),
        ])
      })
    })
  })
})
