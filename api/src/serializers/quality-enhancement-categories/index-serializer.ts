import { pick } from "lodash"

import { type PolicyAsReference } from "@/policies/base-policy"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import User from "@/models/user"
import QualityEnhancementCategoryPolicy from "@/policies/quality-enhancement-category-policy"
import BaseSerializer from "@/serializers/base-serializer"

export type QualityEnhancementCategoryIndexView = Pick<
  QualityEnhancementCategory,
  | "id"
  | "fundingPeriodId"
  | "categoryName"
  | "fromAge"
  | "toAge"
  | "monthlyAmount"
  | "childCareSpaceCategoryId"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> & { policy: PolicyAsReference }

export class IndexSerializer extends BaseSerializer<QualityEnhancementCategory> {
  constructor(
    protected record: QualityEnhancementCategory,
    protected currentUser: User
  ) {
    super(record)
  }

  perform(): QualityEnhancementCategoryIndexView {
    return {
      ...pick(this.record, [
        "id",
        "fundingPeriodId",
        "categoryName",
        "fromAge",
        "toAge",
        "monthlyAmount",
        "childCareSpaceCategoryId",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ]),
      policy: new QualityEnhancementCategoryPolicy(this.currentUser, this.record).toJSON(),
    }
  }
}
