import FactoryShark from "factory-shark"

import { QualityEnhancementCategory } from "@/models"
import childCareCategoryFactory from "@/factories/child-care-category-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const qualityEnhancementCategoryFactory = FactoryShark.define<QualityEnhancementCategory>(
  QualityEnhancementCategory,
  ({ associate }) => {
    const fundingPeriod = associate("fundingPeriod", fundingPeriodFactory)
    associate("childCareCategory", childCareCategoryFactory, (resolvedParams) => ({
      fundingPeriodId: resolvedParams.fundingPeriodId ?? fundingPeriod.id,
    }))

    return { monthlyAmount: "100.0000" }
  }
)

export default qualityEnhancementCategoryFactory
