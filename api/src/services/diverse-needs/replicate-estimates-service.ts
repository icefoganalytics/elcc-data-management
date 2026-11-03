import { Op } from "@sequelize/core"
import { isNil } from "lodash"
import db, { DiverseNeed, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(private diverseNeed: DiverseNeed) {
    super()
  }
  async perform(): Promise<void> {
    await db.transaction(async () => {
      const { fiscalPeriodId, centreId, categoryId, estimatedChildOccupancyRate } = this.diverseNeed
      const source = await FiscalPeriod.findByPk(fiscalPeriodId)
      if (isNil(source)) throw new Error(`Fiscal period with ID ${fiscalPeriodId} not found`)
      await FiscalPeriod.findEach(
        {
          attributes: ["id"],
          where: {
            fundingPeriodId: source.fundingPeriodId,
            dateStart: { [Op.gt]: source.dateEnd },
          },
        },
        async (target) => {
          const row = await DiverseNeed.findOne({
            where: { centreId, fiscalPeriodId: target.id, categoryId },
          })
          if (isNil(row)) return
          await row.update({ estimatedChildOccupancyRate, actualChildOccupancyRate: "0.0000" })
        }
      )
    })
  }
}
