import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import { ChildCareSpaceCategory, type User } from "@/models"
import { ChildCareSpaceCategoryPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"

export type ChildCareSpaceCategoryIndexView = Pick<
  ChildCareSpaceCategory,
  | "id"
  | "fundingPeriodId"
  | "categoryName"
  | "fromAge"
  | "toAge"
  | "monthlyAmount"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> & {
  policy: PolicyAsReference
}

export class IndexSerializer extends BaseSerializer<ChildCareSpaceCategory> {
  constructor(
    protected record: ChildCareSpaceCategory,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): ChildCareSpaceCategoryIndexView {
    const serializedPolicy = this.serializePolicy(this.record, this.currentUser)

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
        "deletedAt",
      ]),
      policy: serializedPolicy,
    }
  }

  private serializePolicy(record: ChildCareSpaceCategory, currentUser: User): PolicyAsReference {
    return new ChildCareSpaceCategoryPolicy(currentUser, record).toJSON()
  }
}
