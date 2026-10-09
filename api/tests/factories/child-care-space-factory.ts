import { faker } from "@faker-js/faker"
import { Factory } from "fishery"

import { ChildCareSpace } from "@/models"

import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import childCareSpaceCategoryFactory from "@/factories/child-care-space-category-factory"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const childCareSpaceFactory = Factory.define<ChildCareSpace>(
  ({ associations, params, onCreate }) => {
    onCreate(async (childCareSpace) => {
      try {
        await nestedSaveAndAssociateIfNew(childCareSpace)
        return childCareSpace
      } catch (error) {
        console.error(error)
        throw new Error(
          `Could not create ChildCareSpace with attributes: ${JSON.stringify(childCareSpace.dataValues, null, 2)}`
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
      childCareSpaceCategoryFactory.associations({ fundingPeriod }).build({
        id: params.categoryId,
      })
    const monthlyAmount = params.monthlyAmount ?? category.monthlyAmount
    const estimatedChildOccupancyRate =
      params.estimatedChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const actualChildOccupancyRate =
      params.actualChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })

    const childCareSpace = ChildCareSpace.build({
      centreId: centre.id,
      fiscalPeriodId: fiscalPeriod.id,
      categoryId: category.id,
      lineName: params.lineName ?? category.categoryName,
      monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    })

    childCareSpace.centre = centre
    childCareSpace.fiscalPeriod = fiscalPeriod
    childCareSpace.category = category
    return childCareSpace
  }
)

export default childCareSpaceFactory
