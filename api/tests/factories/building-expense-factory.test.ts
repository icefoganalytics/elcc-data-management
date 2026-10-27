import { BuildingExpense, BuildingExpenseCategory } from "@/models"

import { buildingExpenseCategoryFactory, fundingRegionFactory } from "@/factories"

import buildingExpenseFactory from "@/factories/building-expense-factory"

describe("tests/factories/building-expense-factory.ts", () => {
  describe("buildingExpenseFactory", () => {
    describe("#create", () => {
      test("when generating a category, snapshots its persisted funding region", async () => {
        // Arrange
        const attributes = { actualCost: "100.0000" }

        // Act
        const buildingExpense = await buildingExpenseFactory.create(attributes)

        // Assert
        const category = await BuildingExpenseCategory.findByPk(buildingExpense.categoryId, {
          include: ["fundingRegion"],
          rejectOnEmpty: true,
        })
        const persistedBuildingExpense = await BuildingExpense.findByPk(buildingExpense.id)
        expect(persistedBuildingExpense).toEqual(
          expect.objectContaining({ fundingRegionSnapshot: category.fundingRegion?.region })
        )
      })

      test("when a snapshot is explicit, preserves it instead of the current region", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create({ region: "Current region" })
        const category = await buildingExpenseCategoryFactory.create({
          fundingRegionId: fundingRegion.id,
        })

        // Act
        const buildingExpense = await buildingExpenseFactory.create({
          categoryId: category.id,
          fundingRegionSnapshot: "Historical region",
        })

        // Assert
        const persistedBuildingExpense = await BuildingExpense.findByPk(buildingExpense.id)
        expect(persistedBuildingExpense).toEqual(
          expect.objectContaining({ fundingRegionSnapshot: "Historical region" })
        )
      })
    })
  })
})
