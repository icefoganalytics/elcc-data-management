import { IsolationLevel, Op } from "@sequelize/core"
import { isNil } from "lodash"

import db, { ChildCareSpace, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(private childCareSpace: ChildCareSpace) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        const sourceChildCareSpace = await ChildCareSpace.findByPk(this.childCareSpace.id, {
          transaction,
        })
        if (isNil(sourceChildCareSpace)) {
          throw new Error(`Child Care Space with ID ${this.childCareSpace.id} not found`)
        }

        const { fiscalPeriodId, centreId, categoryId, estimatedChildOccupancyRate } =
          sourceChildCareSpace
        const sourceFiscalPeriod = await FiscalPeriod.findByPk(fiscalPeriodId, { transaction })
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
            transaction,
          },
          async (futureFiscalPeriod) => {
            const futureChildCareSpace = await ChildCareSpace.findOne({
              where: {
                centreId,
                fiscalPeriodId: futureFiscalPeriod.id,
                categoryId,
              },
              transaction,
            })
            if (isNil(futureChildCareSpace)) {
              throw new Error(
                `Expected Child Care Space for fiscal period ${futureFiscalPeriod.id} and category ${categoryId}`
              )
            }

            await futureChildCareSpace.update(
              {
                estimatedChildOccupancyRate,
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
