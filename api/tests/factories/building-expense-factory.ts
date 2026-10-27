import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { BuildingExpense } from "@/models"

import buildingExpenseCategoryFactory from "@/factories/building-expense-category-factory"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const buildingExpenseFactory = FactoryShark.define<BuildingExpense>(
  BuildingExpense,
  ({ associate, params, beforeCreate }) => {
    associate("centre", centreFactory)
    associate("fiscalPeriod", fiscalPeriodFactory)
    const category = associate("category", buildingExpenseCategoryFactory)

    const categoryDefaults = params.category ?? category
    const fundingRegionSnapshot =
      params.fundingRegionSnapshot ??
      categoryDefaults.fundingRegion?.region ??
      faker.location.country()

    beforeCreate(async (buildingExpense) => {
      if (params.fundingRegionSnapshot !== undefined) return

      const resolvedCategory = buildingExpense.category
      if (resolvedCategory === undefined) return

      await resolvedCategory.reload({ include: ["fundingRegion"] })
      buildingExpense.fundingRegionSnapshot =
        resolvedCategory.fundingRegion?.region ?? fundingRegionSnapshot
    })

    return {
      fundingRegionSnapshot,
      subsidyRate: faker.finance.amount({ min: 0.01, max: 0.5, dec: 4 }),
      buildingUsagePercent: faker.finance.amount({ min: 0, max: 100, dec: 2 }),
      estimatedCost: faker.finance.amount({ min: 100, max: 10000, dec: 4 }),
      actualCost: faker.finance.amount({ min: 100, max: 10000, dec: 4 }),
      totalCost: faker.finance.amount({ min: 10, max: 5000, dec: 4 }),
    }
  }
)

export default buildingExpenseFactory
