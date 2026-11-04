import type { Attributes } from "@sequelize/core"

import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import BaseService from "@/services/base-service"

export type ChildrenWithDiverseNeedsFundingRecordUpdateAttributes = Pick<
  Attributes<ChildrenWithDiverseNeedsFundingRecord>,
  "estimatedChildOccupancyRate" | "actualChildOccupancyRate"
>

export class UpdateService extends BaseService {
  constructor(
    private childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecord,
    private attributes: Partial<ChildrenWithDiverseNeedsFundingRecordUpdateAttributes>
  ) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingRecord> {
    return this.childrenWithDiverseNeedsFundingRecord.update(this.attributes)
  }
}
