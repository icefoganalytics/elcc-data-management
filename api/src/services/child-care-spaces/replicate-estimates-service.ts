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

    const futureFiscalPeriods = await FiscalPeriod.findAll({
      where: {
        fundingPeriodId: sourceFiscalPeriod.fundingPeriodId,
        dateStart: {
          [Op.gt]: sourceFiscalPeriod.dateEnd,
        },
      },
    })

    await db.transaction(async () => {
      for (const futureFiscalPeriod of futureFiscalPeriods) {
        const futureChildCareSpace = await ChildCareSpace.findOne({
          where: {
            centreId: this.childCareSpace.centreId,
            fiscalPeriodId: futureFiscalPeriod.id,
            fundingSubmissionLineId: this.childCareSpace.fundingSubmissionLineId,
          },
        })
        if (isNil(futureChildCareSpace)) {
          throw new Error(
            `Expected Child Care Space for fiscal period ${futureFiscalPeriod.id} and funding submission line ${this.childCareSpace.fundingSubmissionLineId}`
          )
        }

        await futureChildCareSpace.update({
          estimatedChildOccupancyRate: this.childCareSpace.estimatedChildOccupancyRate,
          actualChildOccupancyRate: "0.0000",
        })
      }
    })
  }
}

export default ReplicateEstimatesService
