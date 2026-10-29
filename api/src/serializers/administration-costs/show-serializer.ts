import { pick } from "lodash"

import { AdministrationCost } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type AdministrationCostAsShow = Pick<
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
>

export class ShowSerializer extends BaseSerializer<AdministrationCost> {
  perform(): AdministrationCostAsShow {
    return pick(this.record, [
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
    ])
  }
}

export default ShowSerializer
