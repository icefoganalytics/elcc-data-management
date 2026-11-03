import { pick } from "lodash"
import { DiverseNeed } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"
export class ShowSerializer extends BaseSerializer<DiverseNeed> {
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
