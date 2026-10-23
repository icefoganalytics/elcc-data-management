import { Factory } from "fishery"

import { type AdministrationCostAsShow } from "@/api/administration-costs-api"

export const administrationCostFactory = Factory.define<AdministrationCostAsShow>(() => {
  const timestamp = "2026-01-01T00:00:00.000Z"

  return {
    id: 2,
    centreId: 1,
    fiscalPeriodId: 1,
    categoryId: 2,
    childCareSpaceCategoryId: 9,
    lineName: "Infants",
    monthlyAmount: "10.0000",
    estimatedChildOccupancyRate: "0.0000",
    actualChildOccupancyRate: "0.0000",
    estimatedComputedTotal: "0.0000",
    actualComputedTotal: "0.0000",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  }
})

export default administrationCostFactory
