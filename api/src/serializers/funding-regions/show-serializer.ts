import { pick } from "lodash"

import { FundingRegion } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type FundingRegionAsShow = Pick<
  FundingRegion,
  "id" | "region" | "subsidyRate" | "hotMealIncrementAmount" | "createdAt" | "updatedAt"
>

export class ShowSerializer extends BaseSerializer<FundingRegion> {
  perform(): FundingRegionAsShow {
    return pick(this.record, [
      "id",
      "region",
      "subsidyRate",
      "hotMealIncrementAmount",
      "createdAt",
      "updatedAt",
    ])
  }
}

export default ShowSerializer
