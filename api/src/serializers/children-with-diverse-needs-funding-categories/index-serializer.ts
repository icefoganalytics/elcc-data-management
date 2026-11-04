import { pick } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, User } from "@/models"
import { ChildrenWithDiverseNeedsFundingCategoryPolicy } from "@/policies"
import { type PolicyAsReference } from "@/policies/base-policy"
import BaseSerializer from "@/serializers/base-serializer"

export class IndexSerializer extends BaseSerializer<ChildrenWithDiverseNeedsFundingCategory> {
  constructor(
    protected record: ChildrenWithDiverseNeedsFundingCategory,
    private currentUser: User
  ) {
    super(record)
  }

  perform() {
    return {
      ...pick(this.record, [
        "id",
        "fundingPeriodId",
        "categoryName",
        "fromAge",
        "toAge",
        "monthlyAmount",
        "createdAt",
        "updatedAt",
      ]),
      policy: this.serializePolicy(this.record, this.currentUser),
    }
  }

  private serializePolicy(
    record: ChildrenWithDiverseNeedsFundingCategory,
    currentUser: User
  ): PolicyAsReference {
    return new ChildrenWithDiverseNeedsFundingCategoryPolicy(currentUser, record).toJSON()
  }
}
