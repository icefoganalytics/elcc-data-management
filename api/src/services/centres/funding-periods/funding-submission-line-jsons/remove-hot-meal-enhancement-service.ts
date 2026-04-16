import { Op } from "@sequelize/core"
import Big from "big.js"
import { DateTime } from "luxon"
import { isEmpty } from "lodash"

import {
  Centre,
  FiscalPeriod,
  FundingRegion,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
} from "@/models"
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

        lines.map((line) => {
          const { sectionName } = line
          if (
            sectionName !== FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
          ) {
            return line
          }

          const { monthlyAmount: originalMonthlyAmount } = line
          const monthlyAmount = this.calculateMonthlyAmountWithoutEnhancement(
            originalMonthlyAmount,
            hotMealIncrementAmount
          )
          line.monthlyAmount = monthlyAmount
          return line
        })

        await fundingSubmissionLineJson.update({
          lines,
        })
      }
    )
  }

  private calculateMonthlyAmountWithoutEnhancement(
    monthlyAmount: string,
    hotMealIncrementAmount: string
  ): string {
    const monthlyAmountAsBig = Big(monthlyAmount)
    const hotMealIncrementAsBig = Big(hotMealIncrementAmount)
    const reducedAmountAsBig = monthlyAmountAsBig.minus(hotMealIncrementAsBig)

    return reducedAmountAsBig.toFixed(4)
  }
}

export default RemoveHotMealEnhancementService
