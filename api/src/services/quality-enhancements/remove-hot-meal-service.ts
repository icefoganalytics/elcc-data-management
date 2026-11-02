import { Op } from "@sequelize/core"
import { DateTime } from "luxon"

import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"
import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"

export class RemoveHotMealService extends BaseService {
  constructor(private centre: Centre) {
    super()
  }

  async perform(): Promise<void> {
    const effectivePeriodStart = DateTime.utc().startOf("day").toJSDate()
    const fiscalPeriods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: { dateEnd: { [Op.gte]: effectivePeriodStart } },
    })
    const enhancements = await QualityEnhancement.findAll({
      where: {
        centreId: this.centre.id,
        fiscalPeriodId: fiscalPeriods.map(({ id }) => id),
        [Op.or]: [
          { hotMealAppliedAt: { [Op.ne]: null } },
          { hotMealIncrementAmount: { [Op.ne]: "0" } },
        ],
      },
    })
    for (const enhancement of enhancements) {
      await enhancement.update({ hotMealIncrementAmount: "0.0000", hotMealAppliedAt: null })
    }
  }
}

export default RemoveHotMealService
