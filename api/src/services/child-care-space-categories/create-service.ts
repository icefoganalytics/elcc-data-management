import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildCareSpaceCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildCareSpaceCategoryCreationAttributes = Partial<
  CreationAttributes<ChildCareSpaceCategory>
>

export class CreateService extends BaseService {
  constructor(private attributes: ChildCareSpaceCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory> {
    const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = this.attributes
    if (isNil(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isNil(categoryName)) throw new Error("Category name is required")
    if (isNil(monthlyAmount)) throw new Error("Monthly amount is required")
    return ChildCareSpaceCategory.create({
      fundingPeriodId,
      categoryName,
      fromAge: fromAge ?? null,
      toAge: toAge ?? null,
      monthlyAmount,
    })
  }
}

export default CreateService
