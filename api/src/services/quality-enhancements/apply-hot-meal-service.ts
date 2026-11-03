import { Op } from "@sequelize/core"
import { isNil } from "lodash"
import { DateTime } from "luxon"

import db from "@/db/db-client"
import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"
import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"

export class ApplyHotMealService extends BaseService {
  constructor(private centre: Centre) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(async (transaction) => {
      const centre = await this.centre.reload({ include: ["fundingRegion"], transaction })
      if (isNil(centre.fundingRegion))
        throw new Error(`Funding region for centre ${centre.id} not found`)
      const effectivePeriodStart = DateTime.utc().startOf("day").toJSDate()
      const fiscalPeriods = await FiscalPeriod.findAll({
        attributes: ["id"],
        where: { dateEnd: { [Op.gte]: effectivePeriodStart } },
        transaction,
      })
      const enhancements = await QualityEnhancement.findAll({
        where: {
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriods.map(({ id }) => id),
          hotMealAppliedAt: null,
          hotMealIncrementAmount: "0",
        },
        transaction,
      })
      for (const enhancement of enhancements) {
        await enhancement.update(
          {
            hotMealIncrementAmount: centre.fundingRegion.hotMealIncrementAmount,
            hotMealAppliedAt: new Date(),
          },
          { transaction }
        )
      }
    })
  }
}

export default ApplyHotMealService
