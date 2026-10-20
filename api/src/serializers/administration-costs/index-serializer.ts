import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import { AdministrationCost, type User } from "@/models"
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
    const serializedPolicy = new AdministrationCostPolicy(this.currentUser, this.record).toJSON()

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
}

export default IndexSerializer
