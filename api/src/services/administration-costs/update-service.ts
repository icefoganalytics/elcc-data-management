import { IsolationLevel, type Attributes } from "@sequelize/core"

import db, { AdministrationCost } from "@/models"
import BaseService from "@/services/base-service"

export type AdministrationCostUpdateAttributes = Pick<
  Attributes<AdministrationCost>,
  "estimatedChildOccupancyRate" | "actualChildOccupancyRate"
>

export class UpdateService extends BaseService {
  constructor(
    private administrationCost: AdministrationCost,
    private attributes: Partial<AdministrationCostUpdateAttributes>
  ) {
    super()
  }

  async perform(): Promise<AdministrationCost> {
    return db.transaction({ isolationLevel: IsolationLevel.REPEATABLE_READ }, async () => {
      await this.administrationCost.reload()
      await this.administrationCost.update(this.attributes)

      return this.administrationCost.reload()
    })
  }
}

export default UpdateService
