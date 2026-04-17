import { Op } from "@sequelize/core"
import Big from "big.js"
import { DateTime } from "luxon"
import { has, isEmpty } from "lodash"

import {
  Centre,
  FiscalPeriod,
  FundingRegion,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
} from "@/models"
import BaseService from "@/services/base-service"

export class ApplyHotMealEnhancementService extends BaseService {
  constructor(private centre: Centre) {
    super()
  }

  async perform(): Promise<void> {
    const currentDate = DateTime.utc().startOf("day")

    const fiscalPeriods = await FiscalPeriod.findAll({
      where: {
        dateEnd: {
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
      await this.applyHotMealEnhancementForPeriod(fiscalPeriod, hotMealIncrementAmount)
    }
  }

  private async applyHotMealEnhancementForPeriod(
    fiscalPeriod: FiscalPeriod,
    hotMealIncrementAmount: string
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

          const { monthlyAmount: preEnhancementAmount } = line
          const programQualityEnhancements = line.programQualityEnhancements ?? {
            preEnhancementAmount,
          }
          if (has(programQualityEnhancements, FundingSubmissionLine.EnhancementTypes.HOT_MEAL)) {
            return line
          }

          programQualityEnhancements[FundingSubmissionLine.EnhancementTypes.HOT_MEAL] = {
            amount: hotMealIncrementAmount,
            appliedAt: DateTime.utc().toISO(),
          }

          const monthlyAmount = this.calculateMonthlyAmountFromEnhancements(
            preEnhancementAmount,
            hotMealIncrementAmount
          )

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
    hotMealIncrementAmount: string
  ): string {
    const preEnhancementAmountAsBig = Big(preEnhancementAmount)
    const hotMealIncrementAsBig = Big(hotMealIncrementAmount)
    const enhancedAmountAsBig = preEnhancementAmountAsBig.plus(hotMealIncrementAsBig)

    return enhancedAmountAsBig.toFixed(4)
  }
}

export default ApplyHotMealEnhancementService
