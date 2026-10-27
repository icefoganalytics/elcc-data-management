import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"

import { QualityEnhancementCategory } from "@/models"

import fundingPeriodFactory from "@/factories/funding-period-factory"

export const qualityEnhancementCategoryFactory = FactoryShark.define<QualityEnhancementCategory>(
  QualityEnhancementCategory,
  ({ associate, sequence }) => {
    associate("fundingPeriod", fundingPeriodFactory)

    const categoryName = `${faker.commerce.productAdjective()} quality-${sequence}`

    return {
      categoryName,
      fromAge: 0,
      toAge: 5,
      monthlyAmount: "100.0000",
      childCareSpaceCategoryId: null,
    }
  }
)

export default qualityEnhancementCategoryFactory
