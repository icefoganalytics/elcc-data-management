import { Factory } from "fishery"

import { type ChildCareSpaceAsShow } from "@/api/child-care-spaces-api"

export const childCareSpaceFactory = Factory.define<ChildCareSpaceAsShow>(({ sequence }) => {
  const timestamp = "2026-01-01T00:00:00.000Z"

  return {
    id: sequence,
    centreId: 1,
    fiscalPeriodId: 1,
    categoryId: 9,
    lineName: "Renamed Infant Cohort",
    monthlyAmount: "100.0000",
    estimatedChildOccupancyRate: "0.0000",
    actualChildOccupancyRate: "0.0000",
    estimatedComputedTotal: "0.0000",
    actualComputedTotal: "0.0000",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
})

export default childCareSpaceFactory
