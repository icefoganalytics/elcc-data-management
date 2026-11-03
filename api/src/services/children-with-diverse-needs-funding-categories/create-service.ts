import { isUndefined } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildrenWithDiverseNeedsFundingCategoryCreationAttributes = {
  fundingPeriodId?: number
  categoryName?: string
  fromAge?: number | null
  toAge?: number | null
  monthlyAmount?: string
}

export class CreateService extends BaseService {
  constructor(private attributes: ChildrenWithDiverseNeedsFundingCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory> {
    const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = this.attributes
    if (isUndefined(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isUndefined(categoryName)) throw new Error("Category name is required")
    if (isUndefined(fromAge)) throw new Error("From age is required")
    if (isUndefined(toAge)) throw new Error("To age is required")
    if (isUndefined(monthlyAmount)) throw new Error("Monthly amount is required")

    return ChildrenWithDiverseNeedsFundingCategory.create({
      fundingPeriodId,
      categoryName,
      fromAge,
      toAge,
      monthlyAmount,
    })
  }
}
