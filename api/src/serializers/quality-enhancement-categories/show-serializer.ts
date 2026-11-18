import { pick } from "lodash"

import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseSerializer from "@/serializers/base-serializer"

export type QualityEnhancementCategoryShowView = Pick<
  QualityEnhancementCategory,
  | "id"
  | "fundingPeriodId"
  | "childCareCategoryId"
  | "categoryName"
  | "fromAge"
  | "toAge"
  | "monthlyAmount"
  | "childCareCategoryId"
  | "createdAt"
  | "updatedAt"
>

export class ShowSerializer extends BaseSerializer<QualityEnhancementCategory> {
  constructor(protected record: QualityEnhancementCategory) {
    super(record)
  }

  perform(): QualityEnhancementCategoryShowView {
    return pick(this.record, [
      "id",
      "fundingPeriodId",
      "childCareCategoryId",
      "categoryName",
      "fromAge",
      "toAge",
      "monthlyAmount",
      "childCareCategoryId",
      "createdAt",
      "updatedAt",
    ])
  }
}
