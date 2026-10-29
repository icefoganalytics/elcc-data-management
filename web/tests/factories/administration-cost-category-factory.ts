import { Factory } from "fishery"

import { type AdministrationCostCategoryAsShow } from "@/api/administration-cost-categories-api"

export const administrationCostCategoryFactory = Factory.define<AdministrationCostCategoryAsShow>(
  ({ sequence }) => {
    const timestamp = "2026-01-01T00:00:00.000Z"

    return {
      id: sequence,
      fundingPeriodId: sequence,
      childCareSpaceCategoryId: null,
      categoryName: "Administration Cost Category",
      fromAge: null,
      toAge: null,
      monthlyAmount: "0.0000",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }
)

export default administrationCostCategoryFactory
