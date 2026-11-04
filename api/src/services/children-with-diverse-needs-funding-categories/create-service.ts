import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildrenWithDiverseNeedsFundingCategoryCreationAttributes = Partial<
  CreationAttributes<ChildrenWithDiverseNeedsFundingCategory>
>

export class CreateService extends BaseService {
  constructor(private attributes: ChildrenWithDiverseNeedsFundingCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory> {
    const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = this.attributes
    if (isNil(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isNil(categoryName)) throw new Error("Category name is required")
    if (isNil(monthlyAmount)) throw new Error("Monthly amount is required")

    return ChildrenWithDiverseNeedsFundingCategory.create({
      fundingPeriodId,
      categoryName,
      fromAge,
      toAge,
      monthlyAmount,
    })
  }
}
