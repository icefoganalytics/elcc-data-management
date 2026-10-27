import { Factory } from "fishery"

import { type QualityEnhancementAsShow } from "@/api/quality-enhancements-api"

export const qualityEnhancementFactory = Factory.define<QualityEnhancementAsShow>(
  ({ sequence }) => {
    const timestamp = "2026-01-01T00:00:00.000Z"

    return {
      id: sequence,
      centreId: sequence,
      fiscalPeriodId: sequence,
      categoryId: sequence,
      childCareSpaceCategoryId: null,
      lineName: `Quality Enhancement ${sequence}`,
      baseMonthlyAmount: "20.0000",
      hotMealIncrementAmount: "0.0000",
      hotMealAppliedAt: null,
      monthlyAmount: "20.0000",
      estimatedChildOccupancyRate: "0.0000",
      actualChildOccupancyRate: "0.0000",
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }
)

export default qualityEnhancementFactory
