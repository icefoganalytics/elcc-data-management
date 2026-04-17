import { type CreationAttributes } from "@sequelize/core"
import { DateTime } from "luxon"
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
import {
  type FundingLineValue,
  type FundingLineValueProgramQualityEnhancements,
} from "@/models/funding-line-value"
import BaseService from "@/services/base-service"
import sumByDecimal from "@/utils/sum-by-decimal"

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

        const line = {
          submissionLineId,
          sectionName,
          lineName,
          monthlyAmount: originalMonthlyAmount,
          estimatedChildOccupancyRate: "0",
          actualChildOccupancyRate: "0",
          estimatedComputedTotal: "0",
          actualComputedTotal: "0",
        }

        if (
          hotMeal &&
          sectionName === FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
        ) {
          return this.applyHotMealEnhancement(line, originalMonthlyAmount, hotMealIncrementAmount)
        }

        return line
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

  private applyHotMealEnhancement(
    line: FundingLineValue,
    originalMonthlyAmount: string,
    hotMealIncrementAmount: string
  ) {
    const programQualityEnhancements = {
      preEnhancementAmount: originalMonthlyAmount,
      [FundingSubmissionLine.EnhancementTypes.HOT_MEAL]: {
        amount: hotMealIncrementAmount,
        appliedAt: DateTime.utc().toISO(),
      },
    }

    const monthlyAmount = this.calculateMonthlyAmountFromEnhancements(
      originalMonthlyAmount,
      programQualityEnhancements
    )

    return {
      ...line,
      monthlyAmount,
      programQualityEnhancements,
    }
  }

  private calculateMonthlyAmountFromEnhancements(
    preEnhancementAmount: string,
    programQualityEnhancements: FundingLineValueProgramQualityEnhancements
  ): string {
    const preEnhancementAmountAsBig = Big(preEnhancementAmount)
    const enhancementValues = Object.values(programQualityEnhancements)
    const totalEnhancementAsBig = sumByDecimal(enhancementValues, "amount")
    return preEnhancementAmountAsBig.plus(totalEnhancementAsBig).toFixed(4)
  }
}

export default BulkCreateService
