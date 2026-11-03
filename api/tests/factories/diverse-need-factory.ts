import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"
import { isUndefined } from "lodash"

import { DiverseNeed } from "@/models"

import diverseNeedCategoryFactory from "@/factories/diverse-need-category-factory"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const diverseNeedFactory = FactoryShark.define<DiverseNeed>(
  DiverseNeed,
  ({ associate, params, beforeCreate }) => {
    associate("centre", centreFactory)
    const fiscalPeriod = associate("fiscalPeriod", fiscalPeriodFactory)
    const category = associate("category", diverseNeedCategoryFactory, (resolvedParams) => ({
      fundingPeriodId: resolvedParams.fiscalPeriod?.fundingPeriodId ?? fiscalPeriod.fundingPeriodId,
    }))

    beforeCreate((diverseNeed) => {
      const resolvedCategory = diverseNeed.category
      if (isUndefined(resolvedCategory)) return

      if (isUndefined(params.lineName)) diverseNeed.lineName = resolvedCategory.categoryName
      if (isUndefined(params.monthlyAmount))
        diverseNeed.monthlyAmount = resolvedCategory.monthlyAmount
    })

    return {
      lineName: category.categoryName,
      monthlyAmount: category.monthlyAmount,
      estimatedChildOccupancyRate: faker.finance.amount({ min: 0, max: 1, dec: 4 }),
      actualChildOccupancyRate: faker.finance.amount({ min: 0, max: 1, dec: 4 }),
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    }
  }
)

export default diverseNeedFactory
