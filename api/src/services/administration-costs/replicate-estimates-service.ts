import { Op } from "@sequelize/core"
import { isNil } from "lodash"

import db, { AdministrationCost, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(private administrationCost: AdministrationCost) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(async () => {
      const { fiscalPeriodId, centreId, categoryId, estimatedChildOccupancyRate } =
        this.administrationCost
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
          const futureAdministrationCost = await AdministrationCost.findOne({
            where: {
              centreId,
              fiscalPeriodId: futureFiscalPeriod.id,
              categoryId,
            },
          })
          if (isNil(futureAdministrationCost)) {
            throw new Error(
              `Expected Administration cost for fiscal period ${futureFiscalPeriod.id} and category ${categoryId}`
            )
          }

          await futureAdministrationCost.update({
            estimatedChildOccupancyRate,
            actualChildOccupancyRate: "0.0000",
          })
        }
      )
    })
  }
}

export default ReplicateEstimatesService
