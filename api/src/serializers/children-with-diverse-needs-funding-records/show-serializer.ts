import { pick } from "lodash"

import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export class ShowSerializer extends BaseSerializer<ChildrenWithDiverseNeedsFundingRecord> {
  perform() {
    return pick(this.record, [
      "id",
      "centreId",
      "fiscalPeriodId",
      "categoryId",
      "lineName",
      "monthlyAmount",
      "estimatedChildOccupancyRate",
      "actualChildOccupancyRate",
      "estimatedComputedTotal",
      "actualComputedTotal",
      "createdAt",
      "updatedAt",
    ])
  }
}
