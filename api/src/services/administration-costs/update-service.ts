import { type Attributes } from "@sequelize/core"

import { AdministrationCost } from "@/models"
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
    return this.administrationCost.update(this.attributes)
  }
}

export default UpdateService
