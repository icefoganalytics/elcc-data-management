import { pick } from "lodash"

import { ChildrenWithDiverseNeedsFundingRecord, User } from "@/models"
import { ChildrenWithDiverseNeedsFundingRecordPolicy } from "@/policies"
import { type PolicyAsReference } from "@/policies/base-policy"
import BaseSerializer from "@/serializers/base-serializer"

export class IndexSerializer extends BaseSerializer<ChildrenWithDiverseNeedsFundingRecord> {
  constructor(
    protected record: ChildrenWithDiverseNeedsFundingRecord,
    private currentUser: User
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
      policy: this.serializePolicy(this.record, this.currentUser),
    }
  }

  private serializePolicy(
    record: ChildrenWithDiverseNeedsFundingRecord,
    currentUser: User
  ): PolicyAsReference {
    return new ChildrenWithDiverseNeedsFundingRecordPolicy(currentUser, record).toJSON()
  }
}
