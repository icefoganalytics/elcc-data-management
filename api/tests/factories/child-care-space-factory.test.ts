import { ChildCareSpace, ChildCareSpaceCategory, FiscalPeriod } from "@/models"

import { childCareSpaceCategoryFactory, fiscalPeriodFactory } from "@/factories"

import childCareSpaceFactory from "@/factories/child-care-space-factory"

describe("tests/factories/child-care-space-factory.ts", () => {
  describe("childCareSpaceFactory", () => {
    describe("#create", () => {
      test("when generating a category, uses the fiscal period's funding period", async () => {
        // Arrange
        const fiscalPeriod = await fiscalPeriodFactory.create({ fiscalYear: "2024-25" })

        // Act
        const childCareSpace = await childCareSpaceFactory.associations({ fiscalPeriod }).create()

        // Assert
        const category = await ChildCareSpaceCategory.findByPk(childCareSpace.categoryId)
        expect(category).toEqual(
          expect.objectContaining({ fundingPeriodId: fiscalPeriod.fundingPeriodId })
        )
      })

      test("when generating the entire graph, keeps category and fiscal period in one funding period", async () => {
        // Arrange
        const attributes = { estimatedChildOccupancyRate: "0.5000" }

        // Act
        const childCareSpace = await childCareSpaceFactory.create(attributes)

        // Assert
        const fiscalPeriod = await FiscalPeriod.findByPk(childCareSpace.fiscalPeriodId, {
          rejectOnEmpty: true,
        })
        const category = await ChildCareSpaceCategory.findByPk(childCareSpace.categoryId)
        expect(category).toEqual(
          expect.objectContaining({ fundingPeriodId: fiscalPeriod.fundingPeriodId })
        )
      })

      test("when a category ID is supplied, copies its historical name and amount", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create({
          categoryName: "Historical infant cohort",
          monthlyAmount: "125.5000",
        })

        // Act
        const childCareSpace = await childCareSpaceFactory.create({ categoryId: category.id })

        // Assert
        const persistedChildCareSpace = await ChildCareSpace.findByPk(childCareSpace.id)
        expect(persistedChildCareSpace).toEqual(
          expect.objectContaining({
            categoryId: category.id,
            lineName: "Historical infant cohort",
            monthlyAmount: "125.5",
          })
        )
      })

      test("when worksheet values override a category, preserves the explicit name and amount", async () => {
        // Arrange
        const category = await childCareSpaceCategoryFactory.create({
          categoryName: "Infants",
          monthlyAmount: "100.0000",
        })

        // Act
        const childCareSpace = await childCareSpaceFactory.create({
          categoryId: category.id,
          lineName: "Custom cohort",
          monthlyAmount: "150.2500",
        })

        // Assert
        const persistedChildCareSpace = await ChildCareSpace.findByPk(childCareSpace.id)
        expect(persistedChildCareSpace).toEqual(
          expect.objectContaining({
            categoryId: category.id,
            lineName: "Custom cohort",
            monthlyAmount: "150.25",
          })
        )
      })
    })
  })
})
