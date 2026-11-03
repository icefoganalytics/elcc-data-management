import { pick } from "lodash"
import { DiverseNeed, User } from "@/models"
import { DiverseNeedPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"
export class IndexSerializer extends BaseSerializer<DiverseNeed> {
  constructor(
    protected record: DiverseNeed,
    private user: User
  ) {
    super(record)
  }
  perform() {
    return {
      ...pick(this.record, [
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
      ]),
      policy: new DiverseNeedPolicy(this.user, this.record).toJSON(),
    }
  }
}
