import { faker } from "@faker-js/faker"
import { Factory } from "fishery"

import { AdministrationCostCategory } from "@/models"

import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import childCareSpaceCategoryFactory from "@/factories/child-care-space-category-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const administrationCostCategoryFactory = Factory.define<AdministrationCostCategory>(
  ({ associations, params, sequence, onCreate }) => {
    onCreate(async (administrationCostCategory) => {
      try {
        await nestedSaveAndAssociateIfNew(administrationCostCategory)
        return administrationCostCategory
      } catch (error) {
        console.error(error)
        throw new Error(
          `Could not create AdministrationCostCategory with attributes: ${JSON.stringify(administrationCostCategory.dataValues, null, 2)}`
        )
      }
    })

    const fundingPeriod =
      associations.fundingPeriod ?? fundingPeriodFactory.build({ id: params.fundingPeriodId })
    const categoryName =
      params.categoryName ?? `${faker.commerce.productAdjective()} admin-${sequence}`
    const childCareSpaceCategory = associations.childCareSpaceCategory
    const administrationCostCategory = AdministrationCostCategory.build({
      fundingPeriodId: fundingPeriod.id,
      childCareSpaceCategoryId:
        params.childCareSpaceCategoryId ?? childCareSpaceCategory?.id ?? null,
      categoryName,
      fromAge: params.fromAge ?? 0,
      toAge: params.toAge ?? 5,
      monthlyAmount: params.monthlyAmount ?? "100.0000",
    })
    administrationCostCategory.fundingPeriod = fundingPeriod
    if (childCareSpaceCategory !== undefined) {
      administrationCostCategory.childCareSpaceCategory = childCareSpaceCategory
    }
    return administrationCostCategory
  }
)

export default administrationCostCategoryFactory
