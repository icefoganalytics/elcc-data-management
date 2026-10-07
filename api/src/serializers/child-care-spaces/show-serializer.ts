import { pick } from "lodash"

import { ChildCareSpace } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type ChildCareSpaceAsShow = Pick<
  ChildCareSpace,
  | "id"
  | "centreId"
  | "fiscalPeriodId"
  | "fundingSubmissionLineId"
  | "lineName"
  | "monthlyAmount"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
  | "estimatedComputedTotal"
  | "actualComputedTotal"
  | "createdAt"
  | "updatedAt"
>

export class ShowSerializer extends BaseSerializer<ChildCareSpace> {
  perform(): ChildCareSpaceAsShow {
    return pick(this.record, [
      "id",
      "centreId",
      "fiscalPeriodId",
      "fundingSubmissionLineId",
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
