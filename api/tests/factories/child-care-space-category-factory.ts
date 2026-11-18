import FactoryShark from "factory-shark"

import { ChildCareSpaceCategory } from "@/models"
import childCareCategoryFactory from "@/factories/child-care-category-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const childCareSpaceCategoryFactory = FactoryShark.define<ChildCareSpaceCategory>(
  ChildCareSpaceCategory,
  ({ associate }) => {
    const fundingPeriod = associate("fundingPeriod", fundingPeriodFactory)
    associate("childCareCategory", childCareCategoryFactory, (resolvedParams) => ({
      fundingPeriodId: resolvedParams.fundingPeriodId ?? fundingPeriod.id,
    }))

    return { monthlyAmount: "100.0000" }
  }
)

export default childCareSpaceCategoryFactory
