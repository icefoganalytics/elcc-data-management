import type { Attributes } from "@sequelize/core"
import { DiverseNeed } from "@/models"
import BaseService from "@/services/base-service"

type UpdateAttributes = Pick<
  Attributes<DiverseNeed>,
  "estimatedChildOccupancyRate" | "actualChildOccupancyRate"
>

export class UpdateService extends BaseService {
  constructor(
    private record: DiverseNeed,
    private attributes: Partial<UpdateAttributes>
  ) {
    super()
  }
  async perform(): Promise<DiverseNeed> {
    return this.record.update(this.attributes)
  }
}
