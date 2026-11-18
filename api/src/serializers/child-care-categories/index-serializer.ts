import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import { ChildCareCategory, type User } from "@/models"
import { ChildCareCategoryPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"

export type ChildCareCategoryIndexView = Pick<
  ChildCareCategory,
  "id" | "fundingPeriodId" | "categoryName" | "fromAge" | "toAge" | "createdAt" | "updatedAt"
> & {
  policy: PolicyAsReference
}

export class IndexSerializer extends BaseSerializer<ChildCareCategory> {
  constructor(
    protected record: ChildCareCategory,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): ChildCareCategoryIndexView {
    const serializedPolicy = this.serializePolicy(this.record, this.currentUser)

    return {
      ...pick(this.record, [
        "id",
        "fundingPeriodId",
        "categoryName",
        "fromAge",
        "toAge",
        "createdAt",
        "updatedAt",
      ]),
      policy: serializedPolicy,
    }
  }

  private serializePolicy(record: ChildCareCategory, currentUser: User): PolicyAsReference {
    return new ChildCareCategoryPolicy(currentUser, record).toJSON()
  }
}
