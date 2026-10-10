import { Factory } from "fishery"
import { faker } from "@faker-js/faker"

import { ChildCareSpaceCategory } from "@/models"

import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const childCareSpaceCategoryFactory = Factory.define<ChildCareSpaceCategory>(
  ({ sequence, params, associations, onCreate }) => {
    onCreate(async (category) => {
      try {
        await nestedSaveAndAssociateIfNew(category)
        return category
      } catch (error) {
        console.error(error)
        throw new Error(
          `Could not create ChildCareSpaceCategory with attributes: ${JSON.stringify(category.dataValues, null, 2)}`
        )
      }
    })

    const fundingPeriod =
      associations.fundingPeriod ?? fundingPeriodFactory.build({ id: params.fundingPeriodId })
    const categoryName =
      params.categoryName ?? `${faker.commerce.productAdjective()} spaces-${sequence}`
    const category = ChildCareSpaceCategory.build({
      fundingPeriodId: fundingPeriod.id,
      categoryName,
      fromAge: params.fromAge ?? 0,
      toAge: params.toAge ?? 5,
      monthlyAmount: params.monthlyAmount ?? "100.0000",
    })
    category.fundingPeriod = fundingPeriod
    return category
  }
)

export default childCareSpaceCategoryFactory
