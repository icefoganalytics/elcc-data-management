import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import { ChildCareSpace, type User } from "@/models"
import { ChildCareSpacePolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"

export type ChildCareSpaceAsIndex = Pick<
  ChildCareSpace,
  | "id"
  | "centreId"
  | "categoryId"
  | "lineName"
  | "monthlyAmount"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
  | "estimatedComputedTotal"
  | "actualComputedTotal"
  | "createdAt"
  | "updatedAt"
> & {
  policy: PolicyAsReference
}

export class IndexSerializer extends BaseSerializer<ChildCareSpace> {
  constructor(
    protected record: ChildCareSpace,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): ChildCareSpaceAsIndex {
    const serializedPolicy = this.serializePolicy(this.record, this.currentUser)

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
      policy: serializedPolicy,
    }
  }

  private serializePolicy(record: ChildCareSpace, currentUser: User): PolicyAsReference {
    return new ChildCareSpacePolicy(currentUser, record).toJSON()
  }
}

export default IndexSerializer
