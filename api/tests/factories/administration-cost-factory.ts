import { faker } from "@faker-js/faker"
import { Factory } from "fishery"

import { AdministrationCost } from "@/models"

import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import administrationCostCategoryFactory from "@/factories/administration-cost-category-factory"
import centreFactory from "@/factories/centre-factory"
import childCareSpaceCategoryFactory from "@/factories/child-care-space-category-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const administrationCostFactory = Factory.define<AdministrationCost>(
  ({ associations, params, onCreate }) => {
    onCreate(async (administrationCost) => {
      try {
        await nestedSaveAndAssociateIfNew(administrationCost)
        return administrationCost
      } catch (error) {
        console.error(error)
        throw new Error(
          `Could not create AdministrationCost with attributes: ${JSON.stringify(administrationCost.dataValues, null, 2)}`
        )
      }
    })

    const centre = associations.centre ?? centreFactory.build({ id: params.centreId })
    const fiscalPeriod =
      associations.fiscalPeriod ?? fiscalPeriodFactory.build({ id: params.fiscalPeriodId })
    const fundingPeriod =
      fiscalPeriod.fundingPeriod ?? fundingPeriodFactory.build({ id: fiscalPeriod.fundingPeriodId })
    fiscalPeriod.fundingPeriod = fundingPeriod
    const category =
      associations.category ??
      administrationCostCategoryFactory.associations({ fundingPeriod }).build({
        id: params.categoryId,
      })
    const childCareSpaceCategory =
      associations.childCareSpaceCategory ??
      (category.childCareSpaceCategoryId === null
        ? undefined
        : childCareSpaceCategoryFactory.associations({ fundingPeriod }).build({
            id: category.childCareSpaceCategoryId,
          }))
    const monthlyAmount = params.monthlyAmount ?? category.monthlyAmount
    const estimatedChildOccupancyRate =
      params.estimatedChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const actualChildOccupancyRate =
      params.actualChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })

    const administrationCost = AdministrationCost.build({
      centreId: centre.id,
      fiscalPeriodId: fiscalPeriod.id,
      categoryId: category.id,
      childCareSpaceCategoryId:
        params.childCareSpaceCategoryId ?? category.childCareSpaceCategoryId ?? null,
      lineName: params.lineName ?? category.categoryName,
      monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    })

    administrationCost.centre = centre
    administrationCost.fiscalPeriod = fiscalPeriod
    administrationCost.category = category
    if (childCareSpaceCategory !== undefined) {
      administrationCost.childCareSpaceCategory = childCareSpaceCategory
    }
    return administrationCost
  }
)

export default administrationCostFactory
