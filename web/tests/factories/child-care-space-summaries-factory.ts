import { Factory } from "fishery"

import { type ChildCareSpaceSummaries } from "@/api/child-care-spaces-api"

export const childCareSpaceSummariesFactory = Factory.define<ChildCareSpaceSummaries>(() => ({
  totalEstimated: "0.0000",
  totalActual: "0.0000",
  totalEstimatedOccupancy: "0.0000",
  totalActualOccupancy: "0.0000",
}))

export default childCareSpaceSummariesFactory
