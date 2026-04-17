import { pick } from "lodash"

import { FundingRegion } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type FundingRegionAsIndex = Pick<
  FundingRegion,
  "id" | "region" | "subsidyRate" | "hotMealIncrementAmount" | "createdAt" | "updatedAt"
>

export class IndexSerializer extends BaseSerializer<FundingRegion> {
  perform(): FundingRegionAsIndex {
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

export default IndexSerializer
