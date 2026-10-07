import { faker } from "@faker-js/faker"
import { Factory } from "fishery"

import { ChildCareSpace } from "@/models"

import { nestedSaveAndAssociateIfNew } from "@/factories/helpers"
import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"
import { fundingSubmissionLineFactory } from "@/factories/funding-submission-line-factory"

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

    const centre =
      associations.centre ??
      centreFactory.build({
        id: params.centreId,
      })
    const fiscalPeriod =
      associations.fiscalPeriod ??
      fiscalPeriodFactory.build({
        id: params.fiscalPeriodId,
      })

    if (fiscalPeriod.fundingPeriodId === null || fiscalPeriod.fundingPeriodId === undefined) {
      fiscalPeriod.fundingPeriod = fundingPeriodFactory.build()
    }
    const fundingSubmissionLine =
      associations.fundingSubmissionLine ??
      fundingSubmissionLineFactory.build({
        id: params.fundingSubmissionLineId,
      })
    const monthlyAmount =
      params.monthlyAmount ?? faker.finance.amount({ min: 10, max: 1000, dec: 4 })
    const estimatedChildOccupancyRate =
      params.estimatedChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })
    const actualChildOccupancyRate =
      params.actualChildOccupancyRate ?? faker.finance.amount({ min: 0, max: 1, dec: 4 })

    const childCareSpace = ChildCareSpace.build({
      centreId: centre.id,
      fiscalPeriodId: fiscalPeriod.id,
      fundingSubmissionLineId: fundingSubmissionLine.id,
      lineName: params.lineName ?? fundingSubmissionLine.lineName,
      monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    })

    childCareSpace.centre = centre
    childCareSpace.fiscalPeriod = fiscalPeriod
    childCareSpace.fundingSubmissionLine = fundingSubmissionLine

    return childCareSpace
  }
)

export default childCareSpaceFactory
