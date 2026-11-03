import { pick } from "lodash"
import { type PolicyAsReference } from "@/policies/base-policy"
import { ChildrenWithDiverseNeedsFundingCategory, User } from "@/models"
import { ChildrenWithDiverseNeedsFundingCategoryPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"
export class IndexSerializer extends BaseSerializer<ChildrenWithDiverseNeedsFundingCategory> {
  constructor(
    protected record: ChildrenWithDiverseNeedsFundingCategory,
    protected user: User
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
      policy: new ChildrenWithDiverseNeedsFundingCategoryPolicy(
        this.user,
        this.record
      ).toJSON() as PolicyAsReference,
    }
  }
}
