import { Factory } from "fishery"
import { faker } from "@faker-js/faker"

import QualityEnhancement from "@/models/quality-enhancement"
import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"
import qualityEnhancementCategoryFactory from "@/factories/quality-enhancement-category-factory"

export const qualityEnhancementFactory = Factory.define<QualityEnhancement>(
  ({ associations, params, onCreate }) => {
    onCreate(async (enhancement) => {
      await nestedSaveAndAssociateIfNew(enhancement)
      return enhancement
    })

    const centre = associations.centre ?? centreFactory.build({ id: params.centreId })
    const fiscalPeriod =
      associations.fiscalPeriod ?? fiscalPeriodFactory.build({ id: params.fiscalPeriodId })
    const fundingPeriod =
      fiscalPeriod.fundingPeriod ?? fundingPeriodFactory.build({ id: fiscalPeriod.fundingPeriodId })
    fiscalPeriod.fundingPeriod = fundingPeriod
    const category =
      associations.category ??
      qualityEnhancementCategoryFactory
        .associations({ fundingPeriod })
        .build({ id: params.categoryId })
    const baseMonthlyAmount = params.baseMonthlyAmount ?? category.monthlyAmount
    const hotMealIncrementAmount = params.hotMealIncrementAmount ?? "0.0000"
    const estimatedChildOccupancyRate =
      params.estimatedChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const actualChildOccupancyRate =
      params.actualChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const enhancement = QualityEnhancement.build({
      centreId: centre.id,
      fiscalPeriodId: fiscalPeriod.id,
      categoryId: category.id,
      childCareSpaceCategoryId:
        params.childCareSpaceCategoryId ?? category.childCareSpaceCategoryId,
      lineName: params.lineName ?? category.categoryName,
      baseMonthlyAmount,
      hotMealIncrementAmount,
      hotMealAppliedAt: params.hotMealAppliedAt ?? null,
      monthlyAmount: baseMonthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    })
    enhancement.centre = centre
    enhancement.fiscalPeriod = fiscalPeriod
    enhancement.category = category
    return enhancement
  }
)

export default qualityEnhancementFactory
