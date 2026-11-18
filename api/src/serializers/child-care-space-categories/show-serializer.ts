import { pick } from "lodash"

import { ChildCareSpaceCategory } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type ChildCareSpaceCategoryShowView = Pick<
  ChildCareSpaceCategory,
  | "id"
  | "fundingPeriodId"
  | "childCareCategoryId"
  | "categoryName"
  | "fromAge"
  | "toAge"
  | "monthlyAmount"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
>

export class ShowSerializer extends BaseSerializer<ChildCareSpaceCategory> {
  perform(): ChildCareSpaceCategoryShowView {
    return pick(this.record, [
      "id",
      "fundingPeriodId",
      "childCareCategoryId",
      "categoryName",
      "fromAge",
      "toAge",
      "monthlyAmount",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ])
  }
}
