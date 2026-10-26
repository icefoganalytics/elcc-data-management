import { pick } from "lodash"

import { AdministrationCostCategory } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type AdministrationCostCategoryAsShow = Pick<
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
>

export class ShowSerializer extends BaseSerializer<AdministrationCostCategory> {
  perform(): AdministrationCostCategoryAsShow {
    return pick(this.record, [
      "id",
      "fundingPeriodId",
      "childCareSpaceCategoryId",
      "categoryName",
      "fromAge",
      "toAge",
      "monthlyAmount",
      "createdAt",
      "updatedAt",
    ])
  }
}

export default ShowSerializer
