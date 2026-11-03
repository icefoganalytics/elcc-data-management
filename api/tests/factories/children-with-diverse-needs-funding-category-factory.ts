import FactoryShark from "factory-shark"

import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"

import fundingPeriodFactory from "@/factories/funding-period-factory"

export const childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryFactory =
  FactoryShark.define<ChildrenWithDiverseNeedsFundingCategory>(
    ChildrenWithDiverseNeedsFundingCategory,
    ({ associate, sequence }) => {
      associate("fundingPeriod", fundingPeriodFactory)

      return {
        categoryName: `Children with Diverse Needs Category ${sequence}`,
        fromAge: 2,
        toAge: 3,
        monthlyAmount: "54.9600",
      }
    }
  )

export default childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryFactory
