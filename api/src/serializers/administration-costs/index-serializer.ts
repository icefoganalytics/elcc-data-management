import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import { type AdministrationCost, type User } from "@/models"
import { AdministrationCostPolicy } from "@/policies"
import BaseSerializer from "@/serializers/base-serializer"

export type AdministrationCostAsIndex = Pick<
  AdministrationCost,
  | "id"
  | "centreId"
  | "fiscalPeriodId"
  | "categoryId"
  | "childCareSpaceCategoryId"
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

export class IndexSerializer extends BaseSerializer<AdministrationCost> {
  constructor(
    protected record: AdministrationCost,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): AdministrationCostAsIndex {
    const serializedPolicy = this.serializePolicy(this.record, this.currentUser)

    return {
      ...pick(this.record, [
        "id",
        "centreId",
        "fiscalPeriodId",
        "categoryId",
        "childCareSpaceCategoryId",
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

  private serializePolicy(record: AdministrationCost, currentUser: User): PolicyAsReference {
    return new AdministrationCostPolicy(currentUser, record).toJSON()
  }
}

export default IndexSerializer
