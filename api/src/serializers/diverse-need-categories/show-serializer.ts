import { pick } from "lodash"
import { DiverseNeedCategory } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"
export class ShowSerializer extends BaseSerializer<DiverseNeedCategory> {
  perform() {
    return pick(this.record, [
      "id",
      "fundingPeriodId",
      "categoryName",
      "fromAge",
      "toAge",
      "monthlyAmount",
      "createdAt",
      "updatedAt",
    ])
  }
}
