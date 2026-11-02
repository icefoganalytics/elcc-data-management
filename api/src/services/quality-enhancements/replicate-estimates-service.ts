import { IsolationLevel, Op } from "@sequelize/core"
import { isNil } from "lodash"

import db from "@/db/db-client"
import FiscalPeriod from "@/models/fiscal-period"
import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(private qualityEnhancement: QualityEnhancement) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        const source = await QualityEnhancement.findByPk(this.qualityEnhancement.id, {
          transaction,
        })
        if (isNil(source))
          throw new Error(`Quality Enhancement with ID ${this.qualityEnhancement.id} not found`)
        const sourcePeriod = await FiscalPeriod.findByPk(source.fiscalPeriodId, { transaction })
        if (isNil(sourcePeriod))
          throw new Error(`Fiscal period with ID ${source.fiscalPeriodId} not found`)

        await FiscalPeriod.findEach(
          {
            attributes: ["id"],
            where: {
              fundingPeriodId: sourcePeriod.fundingPeriodId,
              dateStart: { [Op.gt]: sourcePeriod.dateEnd },
            },
            transaction,
          },
          async (futurePeriod) => {
            const futureEnhancement = await QualityEnhancement.findOne({
              where: {
                centreId: source.centreId,
                fiscalPeriodId: futurePeriod.id,
                categoryId: source.categoryId,
              },
              transaction,
            })
            if (isNil(futureEnhancement)) {
              throw new Error(
                `Expected Quality Enhancement for fiscal period ${futurePeriod.id} and category ${source.categoryId}`
              )
            }
            await futureEnhancement.update(
              {
                estimatedChildOccupancyRate: source.estimatedChildOccupancyRate,
                actualChildOccupancyRate: "0.0000",
              },
              { transaction }
            )
          }
        )
      }
    )
  }
}

export default ReplicateEstimatesService
