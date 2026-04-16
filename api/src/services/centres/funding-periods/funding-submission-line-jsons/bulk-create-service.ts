import { type CreationAttributes } from "@sequelize/core"
import { isEmpty } from "lodash"
import Big from "big.js"

import {
  Centre,
  FiscalPeriod,
  FundingRegion,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
  type FundingPeriod,
} from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<FundingSubmissionLineJson[]> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      where: {
        fundingPeriodId: this.fundingPeriod.id,
      },
    })
    if (isEmpty(fiscalPeriods)) {
      throw new Error("No fiscal periods found for the given funding period")
    }

    const { fiscalYear: fiscalYearLong } = this.fundingPeriod
    const fiscalYearLegacy = FundingSubmissionLine.toLegacyFiscalYearFormat(fiscalYearLong)

    const fundingSubmissionLines = await FundingSubmissionLine.findAll({
      where: {
        fiscalYear: fiscalYearLegacy,
      },
    })
    if (isEmpty(fundingSubmissionLines)) {
      throw new Error("No funding submission lines found for the funding period.")
    }

    const { fundingRegionId, hotMeal } = this.centre
    const fundingRegion = await FundingRegion.findByPk(fundingRegionId, {
      rejectOnEmpty: true,
    })

    const { hotMealIncrementAmount } = fundingRegion

    const fundingSubmissionLineJsonsDefaults = fundingSubmissionLines.map(
      (fundingSubmissionLine) => {
        const {
          id: submissionLineId,
          sectionName,
          lineName,
          monthlyAmount: originalMonthlyAmount,
        } = fundingSubmissionLine
        const monthlyAmount = this.calculateMonthlyAmountWithEnhancements(
          sectionName,
          originalMonthlyAmount,
          hotMeal,
          hotMealIncrementAmount
        )
        return {
          submissionLineId,
          sectionName,
          lineName,
          monthlyAmount,
          estimatedChildOccupancyRate: "0",
          actualChildOccupancyRate: "0",
          estimatedComputedTotal: "0",
          actualComputedTotal: "0",
        }
      }
    )

    const { id: centreId } = this.centre
    const fundingSubmissionLineJsonsAttributes: CreationAttributes<FundingSubmissionLineJson>[] =
      fiscalPeriods.map(({ dateStart, dateEnd }) => {
        const dateName = FundingSubmissionLineJson.asFundingSubmissionLineJsonMonth(dateStart)
        const values = JSON.stringify(fundingSubmissionLineJsonsDefaults)
        return {
          centreId,
          fiscalYear: fiscalYearLegacy,
          dateName,
          dateStart,
          dateEnd,
          values,
        }
      })

    return FundingSubmissionLineJson.bulkCreate(fundingSubmissionLineJsonsAttributes)
  }

  private calculateMonthlyAmountWithEnhancements(
    sectionName: string,
    monthlyAmount: string,
    hotMeal: boolean,
    hotMealIncrementAmount: string
  ): string {
    let monthlyAmountAsBig = Big(monthlyAmount)

    if (
      hotMeal &&
      sectionName === FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
    ) {
      const hotMealIncrementAsBig = Big(hotMealIncrementAmount)
      monthlyAmountAsBig = monthlyAmountAsBig.plus(hotMealIncrementAsBig)
    }

    return monthlyAmountAsBig.toFixed(4)
  }
}

export default BulkCreateService
