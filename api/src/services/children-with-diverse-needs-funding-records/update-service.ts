import type { Attributes } from "@sequelize/core"
import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import BaseService from "@/services/base-service"

type UpdateAttributes = Pick<
  Attributes<ChildrenWithDiverseNeedsFundingRecord>,
  "estimatedChildOccupancyRate" | "actualChildOccupancyRate"
>

export class UpdateService extends BaseService {
  constructor(
    private record: ChildrenWithDiverseNeedsFundingRecord,
    private attributes: Partial<UpdateAttributes>
  ) {
    super()
  }
  async perform(): Promise<ChildrenWithDiverseNeedsFundingRecord> {
    return this.record.update(this.attributes)
  }
}
