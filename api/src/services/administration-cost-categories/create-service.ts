import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import { AdministrationCostCategory } from "@/models"
import BaseService from "@/services/base-service"

export type AdministrationCostCategoryCreationAttributes = Partial<
  CreationAttributes<AdministrationCostCategory>
>

export class CreateService extends BaseService {
  constructor(private attributes: AdministrationCostCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory> {
    const {
      fundingPeriodId,
      childCareSpaceCategoryId,
      categoryName,
      fromAge,
      toAge,
      monthlyAmount,
    } = this.attributes

    if (isNil(fundingPeriodId)) {
      throw new Error("Funding period ID is required")
    }

    if (isNil(categoryName)) {
      throw new Error("Category name is required")
    }

    if (isNil(monthlyAmount)) {
      throw new Error("Monthly amount is required")
    }

    return AdministrationCostCategory.create({
      fundingPeriodId,
      childCareSpaceCategoryId: childCareSpaceCategoryId ?? null,
      categoryName,
      fromAge: fromAge ?? null,
      toAge: toAge ?? null,
      monthlyAmount,
    })
  }
}

export default CreateService
