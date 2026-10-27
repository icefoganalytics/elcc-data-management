import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"

import { QualityEnhancement } from "@/models"

import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"
import qualityEnhancementCategoryFactory from "@/factories/quality-enhancement-category-factory"

export const qualityEnhancementFactory = FactoryShark.define<QualityEnhancement>(
  QualityEnhancement,
  ({ associate, params, beforeCreate }) => {
    associate("centre", centreFactory)
    const fiscalPeriod = associate("fiscalPeriod", fiscalPeriodFactory)
    const category = associate("category", qualityEnhancementCategoryFactory, (resolvedParams) => ({
      fundingPeriodId: resolvedParams.fiscalPeriod?.fundingPeriodId ?? fiscalPeriod.fundingPeriodId,
    }))
    const categoryDefaults = params.category ?? category
    const estimatedChildOccupancyRate = faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const actualChildOccupancyRate = faker.finance.amount({ min: 0, max: 1, dec: 4 })

    // Category overrides resolve after generation; copy snapshots from the persisted parent.
    beforeCreate(async (enhancement) => {
      const resolvedCategory = enhancement.category
      if (resolvedCategory === undefined) return

      if (params.lineName === undefined) {
        enhancement.lineName = resolvedCategory.categoryName
      }

      if (params.baseMonthlyAmount === undefined) {
        enhancement.baseMonthlyAmount = resolvedCategory.monthlyAmount
      }

      if (params.childCareSpaceCategoryId === undefined) {
        enhancement.childCareSpaceCategoryId = resolvedCategory.childCareSpaceCategoryId
      }
    })

    return {
      childCareSpaceCategoryId: categoryDefaults.childCareSpaceCategoryId,
      lineName: categoryDefaults.categoryName,
      baseMonthlyAmount: categoryDefaults.monthlyAmount,
      hotMealIncrementAmount: "0.0000",
      hotMealAppliedAt: null,
      monthlyAmount: categoryDefaults.monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    }
  }
)

export default qualityEnhancementFactory
