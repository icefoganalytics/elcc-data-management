import { Factory } from "fishery"

import type { ChildrenWithDiverseNeedsFundingRecordAsIndex } from "@/api/children-with-diverse-needs-funding-records-api"

export const childrenWithDiverseNeedsFundingRecordFactory =
  Factory.define<ChildrenWithDiverseNeedsFundingRecordAsIndex>(() => {
    const timestamp = "2026-01-01T00:00:00.000Z"

    return {
      id: 2,
      centreId: 1,
      fiscalPeriodId: 1,
      categoryId: 2,
      lineName: "Toddlers",
      monthlyAmount: "54.9600",
      estimatedChildOccupancyRate: "0.0000",
      actualChildOccupancyRate: "0.0000",
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
      createdAt: timestamp,
      updatedAt: timestamp,
      policy: { show: true, create: true, update: true, destroy: false },
    }
  })

export default childrenWithDiverseNeedsFundingRecordFactory
