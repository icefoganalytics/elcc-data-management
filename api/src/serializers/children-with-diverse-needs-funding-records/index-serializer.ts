import { pick } from "lodash"
import { ChildrenWithDiverseNeedsFundingRecord, User } from "@/models"
import { ChildrenWithDiverseNeedsFundingRecordsPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"
export class IndexSerializer extends BaseSerializer<ChildrenWithDiverseNeedsFundingRecord> {
  constructor(
    protected record: ChildrenWithDiverseNeedsFundingRecord,
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
      policy: new ChildrenWithDiverseNeedsFundingRecordsPolicy(this.user, this.record).toJSON(),
    }
  }
}
