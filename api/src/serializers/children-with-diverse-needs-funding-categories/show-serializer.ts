import { pick } from "lodash"
import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"
export class ShowSerializer extends BaseSerializer<ChildrenWithDiverseNeedsFundingCategory> {
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
