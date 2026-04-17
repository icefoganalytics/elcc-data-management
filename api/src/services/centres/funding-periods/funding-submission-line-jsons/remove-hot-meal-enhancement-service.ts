import { Op } from "@sequelize/core"
import { DateTime } from "luxon"
import { isEmpty, isUndefined } from "lodash"

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
          if (isUndefined(programQualityEnhancements) || isEmpty(programQualityEnhancements)) {
            return line
          }

          const hotMealEnhancement =
            programQualityEnhancements[FundingSubmissionLine.EnhancementTypes.HOT_MEAL]
          if (isUndefined(hotMealEnhancement)) {
            return line
          }

          const { preEnhancementAmount } = hotMealEnhancement
          delete programQualityEnhancements[FundingSubmissionLine.EnhancementTypes.HOT_MEAL]

          if (isEmpty(programQualityEnhancements)) {
            delete line.programQualityEnhancements
            return {
              ...line,
              monthlyAmount: preEnhancementAmount,
            }
          }

          return {
            ...line,
            monthlyAmount: preEnhancementAmount,
            programQualityEnhancements,
          }
        })

        await fundingSubmissionLineJson.update({
          lines: newLines,
        })
      }
    )
  }
}

export default RemoveHotMealEnhancementService
