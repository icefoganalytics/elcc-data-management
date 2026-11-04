import { Factory } from "fishery"

import type { ChildrenWithDiverseNeedsFundingCategoryAsIndex } from "@/api/children-with-diverse-needs-funding-categories-api"

export const childrenWithDiverseNeedsFundingCategoryFactory =
  Factory.define<ChildrenWithDiverseNeedsFundingCategoryAsIndex>(() => {
    const timestamp = "2026-01-01T00:00:00.000Z"

    return {
      id: 8,
      fundingPeriodId: 3,
      categoryName: "Preschool diverse needs",
      fromAge: null,
      toAge: null,
      monthlyAmount: "54.9600",
      createdAt: timestamp,
      updatedAt: timestamp,
      policy: { show: true, create: true, update: true, destroy: false },
    }
  })

export default childrenWithDiverseNeedsFundingCategoryFactory
