import { pick } from "lodash"

import QualityEnhancement from "@/models/quality-enhancement"
import User from "@/models/user"
import QualityEnhancementPolicy from "@/policies/quality-enhancement-policy"
import { type PolicyAsReference } from "@/policies/base-policy"
import BaseSerializer from "@/serializers/base-serializer"

export type QualityEnhancementIndexView = Pick<
  QualityEnhancement,
  | "id"
  | "centreId"
  | "fiscalPeriodId"
  | "categoryId"
  | "childCareSpaceCategoryId"
  | "lineName"
  | "baseMonthlyAmount"
  | "hotMealIncrementAmount"
  | "hotMealAppliedAt"
  | "monthlyAmount"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
  | "estimatedComputedTotal"
  | "actualComputedTotal"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> & { policy: PolicyAsReference }

export class IndexSerializer extends BaseSerializer<QualityEnhancement> {
  constructor(
    protected record: QualityEnhancement,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): QualityEnhancementIndexView {
    return {
      ...pick(this.record, [
        "id",
        "centreId",
        "fiscalPeriodId",
        "categoryId",
        "childCareSpaceCategoryId",
        "lineName",
        "baseMonthlyAmount",
        "hotMealIncrementAmount",
        "hotMealAppliedAt",
        "monthlyAmount",
        "estimatedChildOccupancyRate",
        "actualChildOccupancyRate",
        "estimatedComputedTotal",
        "actualComputedTotal",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ]),
      policy: new QualityEnhancementPolicy(this.currentUser, this.record).toJSON(),
    }
  }
}
