import { pick } from "lodash"

import { ChildCareCategory } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type ChildCareCategoryShowView = Pick<
  ChildCareCategory,
  "id" | "fundingPeriodId" | "categoryName" | "fromAge" | "toAge" | "createdAt" | "updatedAt"
>

export class ShowSerializer extends BaseSerializer<ChildCareCategory> {
  perform(): ChildCareCategoryShowView {
    return pick(this.record, [
      "id",
      "fundingPeriodId",
      "categoryName",
      "fromAge",
      "toAge",
      "createdAt",
      "updatedAt",
    ])
  }
}
