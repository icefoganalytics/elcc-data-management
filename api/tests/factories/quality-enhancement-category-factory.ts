import { Factory } from "fishery"
import { faker } from "@faker-js/faker"

import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const qualityEnhancementCategoryFactory = Factory.define<QualityEnhancementCategory>(
  ({ associations, params, sequence, onCreate }) => {
    onCreate(async (category) => {
      await nestedSaveAndAssociateIfNew(category)
      return category
    })
    const fundingPeriod =
      associations.fundingPeriod ?? fundingPeriodFactory.build({ id: params.fundingPeriodId })
    const category = QualityEnhancementCategory.build({
      fundingPeriodId: fundingPeriod.id,
      categoryName:
        params.categoryName ?? `${faker.commerce.productAdjective()} quality-${sequence}`,
      fromAge: params.fromAge ?? 0,
      toAge: params.toAge ?? 5,
      monthlyAmount: params.monthlyAmount ?? "100.0000",
      childCareSpaceCategoryId: params.childCareSpaceCategoryId ?? null,
    })
    category.fundingPeriod = fundingPeriod
    return category
  }
)

export default qualityEnhancementCategoryFactory
