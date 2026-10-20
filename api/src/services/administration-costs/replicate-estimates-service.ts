import { IsolationLevel, Op } from "@sequelize/core"
import { isNil } from "lodash"

import db, { AdministrationCost, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class ReplicateEstimatesService extends BaseService {
  constructor(private administrationCost: AdministrationCost) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        const sourceAdministrationCost = await AdministrationCost.findByPk(
          this.administrationCost.id,
          { transaction }
        )
        if (isNil(sourceAdministrationCost)) {
          throw new Error(`Administration cost with ID ${this.administrationCost.id} not found`)
        }

        const { fiscalPeriodId, centreId, categoryId, estimatedChildOccupancyRate } =
          sourceAdministrationCost
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
            const futureAdministrationCost = await AdministrationCost.findOne({
              where: {
                centreId,
                fiscalPeriodId: futureFiscalPeriod.id,
                categoryId,
              },
              transaction,
            })
            if (isNil(futureAdministrationCost)) {
              throw new Error(
                `Expected Administration cost for fiscal period ${futureFiscalPeriod.id} and category ${categoryId}`
              )
            }

            await futureAdministrationCost.update(
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
