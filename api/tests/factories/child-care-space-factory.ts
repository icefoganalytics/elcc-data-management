import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"

import { ChildCareSpace } from "@/models"

import childCareSpaceCategoryFactory from "@/factories/child-care-space-category-factory"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const childCareSpaceFactory = FactoryShark.define<ChildCareSpace>(
  ChildCareSpace,
  ({ associate, params, beforeCreate }) => {
    associate("centre", centreFactory)
    const fiscalPeriod = associate("fiscalPeriod", fiscalPeriodFactory)
    const category = associate("category", childCareSpaceCategoryFactory, (resolvedParams) => ({
      fundingPeriodId: resolvedParams.fiscalPeriod?.fundingPeriodId ?? fiscalPeriod.fundingPeriodId,
    }))
    const categoryDefaults = params.category ?? category
    const estimatedChildOccupancyRate = faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const actualChildOccupancyRate = faker.finance.amount({ min: 0, max: 1, dec: 4 })

    // Category overrides are resolved after generation, before these copied defaults are saved.
    beforeCreate(async (childCareSpace) => {
      const resolvedCategory = childCareSpace.category
      if (resolvedCategory === undefined) return

      if (params.lineName === undefined) {
        childCareSpace.lineName = resolvedCategory.categoryName
      }

      if (params.monthlyAmount === undefined) {
        childCareSpace.monthlyAmount = resolvedCategory.monthlyAmount
      }
    })

    return {
      lineName: categoryDefaults.categoryName,
      monthlyAmount: categoryDefaults.monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    }
  }
)

export default childCareSpaceFactory
