import { pick } from "lodash"

import QualityEnhancement from "@/models/quality-enhancement"
import BaseSerializer from "@/serializers/base-serializer"

export type QualityEnhancementShowView = Pick<
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
>

export class ShowSerializer extends BaseSerializer<QualityEnhancement> {
  constructor(protected record: QualityEnhancement) {
    super(record)
  }

  perform(): QualityEnhancementShowView {
    return pick(this.record, [
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
    ])
  }
}
