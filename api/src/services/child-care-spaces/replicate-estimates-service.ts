import { Op } from "@sequelize/core"
import { isNil } from "lodash"

import db, { ChildCareSpace, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(private childCareSpace: ChildCareSpace) {
    super()
  }

  async perform(): Promise<void> {
    const sourceFiscalPeriod = await FiscalPeriod.findByPk(this.childCareSpace.fiscalPeriodId)
    if (isNil(sourceFiscalPeriod)) {
      throw new Error(`Fiscal period with ID ${this.childCareSpace.fiscalPeriodId} not found`)
    }

    await db.transaction(async () => {
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
          const futureChildCareSpace = await ChildCareSpace.findOne({
            where: {
              centreId: this.childCareSpace.centreId,
              fiscalPeriodId: futureFiscalPeriod.id,
              categoryId: this.childCareSpace.categoryId,
            },
          })
          if (isNil(futureChildCareSpace)) {
            throw new Error(
              `Expected Child Care Space for fiscal period ${futureFiscalPeriod.id} and category ${this.childCareSpace.categoryId}`
            )
          }

          await futureChildCareSpace.update({
            estimatedChildOccupancyRate: this.childCareSpace.estimatedChildOccupancyRate,
            actualChildOccupancyRate: "0.0000",
          })
        }
      )
    })
  }
}

export default ReplicateEstimatesService
