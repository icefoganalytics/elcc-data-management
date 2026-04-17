import { Op } from "@sequelize/core"
import Big from "big.js"
import { DateTime } from "luxon"
import { has, isEmpty, isEqual, isUndefined } from "lodash"

import sumByDecimal from "@/utils/sum-by-decimal"

import {
  Centre,
  FiscalPeriod,
  FundingRegion,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
} from "@/models"
import { type FundingLineValueProgramQualityEnhancements } from "@/models/funding-line-value"
import BaseService from "@/services/base-service"

export class RemoveHotMealEnhancementService extends BaseService {
  constructor(private centre: Centre) {
    super()
  }

  async perform(): Promise<void> {
    const currentDate = DateTime.utc().startOf("day")

    const fiscalPeriods = await FiscalPeriod.findAll({
      where: {
        dateStart: {
          [Op.gte]: currentDate.toJSDate(),
        },
      },
    })
    if (isEmpty(fiscalPeriods)) return

    const { fundingRegionId } = this.centre
    const fundingRegion = await FundingRegion.findByPk(fundingRegionId, {
      rejectOnEmpty: true,
    })

    const { hotMealIncrementAmount } = fundingRegion

    for (const fiscalPeriod of fiscalPeriods) {
      await this.removeHotMealEnhancementForPeriod(fiscalPeriod, hotMealIncrementAmount)
    }
  }

  private async removeHotMealEnhancementForPeriod(
    fiscalPeriod: FiscalPeriod,
    _hotMealIncrementAmount: string
  ): Promise<void> {
    await FundingSubmissionLineJson.findEach(
      {
        where: {
          centreId: this.centre.id,
          dateStart: fiscalPeriod.dateStart,
          dateEnd: fiscalPeriod.dateEnd,
        },
      },
      async (fundingSubmissionLineJson) => {
        const { lines } = fundingSubmissionLineJson

        const newLines = lines.map((line) => {
          const { sectionName } = line
          if (
            sectionName !== FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
          ) {
            return line
          }

          const { programQualityEnhancements } = line
          if (isUndefined(programQualityEnhancements)) {
            return line
          }

          if (!has(programQualityEnhancements, FundingSubmissionLine.EnhancementTypes.HOT_MEAL)) {
            return line
          }

          const { preEnhancementAmount } = programQualityEnhancements
          delete programQualityEnhancements[FundingSubmissionLine.EnhancementTypes.HOT_MEAL]

          const monthlyAmount = this.calculateMonthlyAmountFromEnhancements(
            preEnhancementAmount,
            programQualityEnhancements
          )

          if (isEqual(Object.keys(programQualityEnhancements), ["preEnhancementAmount"])) {
            delete line.programQualityEnhancements
            return {
              ...line,
              monthlyAmount,
            }
          }

          return {
            ...line,
            monthlyAmount,
            programQualityEnhancements,
          }
        })

        await fundingSubmissionLineJson.update({
          lines: newLines,
        })
      }
    )
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

export default RemoveHotMealEnhancementService
