import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import { AdministrationCostCategory, User } from "@/models"
import { AdministrationCostCategoryPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"

export type AdministrationCostCategoryAsIndex = Pick<
  AdministrationCostCategory,
  | "id"
  | "fundingPeriodId"
  | "childCareSpaceCategoryId"
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

export class IndexSerializer extends BaseSerializer<AdministrationCostCategory> {
  constructor(
    protected record: AdministrationCostCategory,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): AdministrationCostCategoryAsIndex {
    const serializedPolicy = this.serializePolicy(this.record, this.currentUser)

    return {
      ...pick(this.record, [
        "id",
        "fundingPeriodId",
        "childCareSpaceCategoryId",
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

  private serializePolicy(
    record: AdministrationCostCategory,
    currentUser: User
  ): PolicyAsReference {
    return new AdministrationCostCategoryPolicy(currentUser, record).toJSON()
  }
}

export default IndexSerializer
