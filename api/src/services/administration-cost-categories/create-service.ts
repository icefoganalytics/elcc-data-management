import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import { AdministrationCostCategory } from "@/models"
import BaseService from "@/services/base-service"

export type AdministrationCostCategoryCreationAttributes = Partial<
  Pick<
    CreationAttributes<AdministrationCostCategory>,
    "fundingPeriodId" | "childCareCategoryId" | "monthlyAmount"
  >
>

export class CreateService extends BaseService {
  constructor(private attributes: AdministrationCostCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory> {
    const { fundingPeriodId, childCareCategoryId, monthlyAmount } = this.attributes
    if (isNil(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isNil(childCareCategoryId)) throw new Error("Child Care category ID is required")
    if (isNil(monthlyAmount)) throw new Error("Monthly amount is required")

    const category = await AdministrationCostCategory.create({
      fundingPeriodId,
      childCareCategoryId,
      monthlyAmount,
    })
    return category.reload({ include: ["childCareCategory"] })
  }
}

export default CreateService
