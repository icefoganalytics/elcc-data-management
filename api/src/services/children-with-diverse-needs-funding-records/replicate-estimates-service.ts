import { Op } from "@sequelize/core"
import { isNil } from "lodash"

import db, { ChildrenWithDiverseNeedsFundingRecord, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(
    private childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecord
  ) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(async () => {
      const { fiscalPeriodId, centreId, categoryId, estimatedChildOccupancyRate } =
        this.childrenWithDiverseNeedsFundingRecord
      const sourceFiscalPeriod = await FiscalPeriod.findByPk(fiscalPeriodId)
      if (isNil(sourceFiscalPeriod)) {
        throw new Error(`Fiscal period with ID ${fiscalPeriodId} not found`)
      }

      await FiscalPeriod.findEach(
        {
          attributes: ["id"],
          where: {
            fundingPeriodId: sourceFiscalPeriod.fundingPeriodId,
            dateStart: {
              [Op.gt]: sourceFiscalPeriod.dateEnd,
            },
          },
        },
        async (futureFiscalPeriod) => {
          const futureRecord = await ChildrenWithDiverseNeedsFundingRecord.findOne({
            where: { centreId, fiscalPeriodId: futureFiscalPeriod.id, categoryId },
          })
          if (isNil(futureRecord)) return

          await futureRecord.update({
            estimatedChildOccupancyRate,
            actualChildOccupancyRate: "0.0000",
          })
        }
      )
    })
  }
}
