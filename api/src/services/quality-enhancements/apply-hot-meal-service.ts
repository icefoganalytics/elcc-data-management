import { DateTime } from "luxon"
import { Op } from "@sequelize/core"
import { isNil } from "lodash"

import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"
import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"

export class ApplyHotMealService extends BaseService {
  constructor(private centre: Centre) {
    super()
  }

  async perform(): Promise<void> {
    const centre = await this.centre.reload({ include: ["fundingRegion"] })
    if (isNil(centre.fundingRegion))
      throw new Error(`Funding region for centre ${centre.id} not found`)
    const effectivePeriodStart = DateTime.utc().startOf("day").toJSDate()
    const fiscalPeriods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: { dateEnd: { [Op.gte]: effectivePeriodStart } },
    })
    const enhancements = await QualityEnhancement.findAll({
      where: {
        centreId: centre.id,
        fiscalPeriodId: fiscalPeriods.map(({ id }) => id),
        hotMealAppliedAt: null,
        hotMealIncrementAmount: "0",
      },
    })
    for (const enhancement of enhancements) {
      await enhancement.update({
        hotMealIncrementAmount: centre.fundingRegion.hotMealIncrementAmount,
        hotMealAppliedAt: new Date(),
      })
    }
  }
}

export default ApplyHotMealService
