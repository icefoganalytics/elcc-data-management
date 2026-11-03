import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"
import { isUndefined } from "lodash"

import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"

import childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryFactory from "@/factories/children-with-diverse-needs-funding-category-factory"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory =
  FactoryShark.define<ChildrenWithDiverseNeedsFundingRecord>(
    ChildrenWithDiverseNeedsFundingRecord,
    ({ associate, params, beforeCreate }) => {
      associate("centre", centreFactory)
      const fiscalPeriod = associate("fiscalPeriod", fiscalPeriodFactory)
      const category = associate(
        "category",
        childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryFactory,
        (resolvedParams) => ({
          fundingPeriodId:
            resolvedParams.fiscalPeriod?.fundingPeriodId ?? fiscalPeriod.fundingPeriodId,
        })
      )

      beforeCreate((childrenWithChildrenWithDiverseNeedsFundingRecordsRecord) => {
        const resolvedCategory = childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.category
        if (isUndefined(resolvedCategory)) return

        if (isUndefined(params.lineName))
          childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.lineName = resolvedCategory.categoryName
        if (isUndefined(params.monthlyAmount))
          childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.monthlyAmount = resolvedCategory.monthlyAmount
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

export default childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory
