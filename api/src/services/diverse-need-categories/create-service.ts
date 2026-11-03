import { isUndefined } from "lodash"

import { DiverseNeedCategory } from "@/models"
import BaseService from "@/services/base-service"

export type DiverseNeedCategoryCreationAttributes = {
  fundingPeriodId?: number
  categoryName?: string
  fromAge?: number | null
  toAge?: number | null
  monthlyAmount?: string
}

export class CreateService extends BaseService {
  constructor(private attributes: DiverseNeedCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<DiverseNeedCategory> {
    const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = this.attributes
    if (isUndefined(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isUndefined(categoryName)) throw new Error("Category name is required")
    if (isUndefined(fromAge)) throw new Error("From age is required")
    if (isUndefined(toAge)) throw new Error("To age is required")
    if (isUndefined(monthlyAmount)) throw new Error("Monthly amount is required")

    return DiverseNeedCategory.create({
      fundingPeriodId,
      categoryName,
      fromAge,
      toAge,
      monthlyAmount,
    })
  }
}
