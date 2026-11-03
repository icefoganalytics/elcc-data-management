import { pick } from "lodash"
import { type PolicyAsReference } from "@/policies/base-policy"
import { DiverseNeedCategory, User } from "@/models"
import { DiverseNeedCategoryPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"
export class IndexSerializer extends BaseSerializer<DiverseNeedCategory> {
  constructor(
    protected record: DiverseNeedCategory,
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
      policy: new DiverseNeedCategoryPolicy(this.user, this.record).toJSON() as PolicyAsReference,
    }
  }
}
