import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import { QualityEnhancementCategory } from "@/models"
import BaseService from "@/services/base-service"

export type QualityEnhancementCategoryCreationAttributes = Partial<
  Pick<
    CreationAttributes<QualityEnhancementCategory>,
    "fundingPeriodId" | "childCareCategoryId" | "monthlyAmount"
  >
>

export class CreateService extends BaseService {
  constructor(private attributes: QualityEnhancementCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<QualityEnhancementCategory> {
    const { fundingPeriodId, childCareCategoryId, monthlyAmount } = this.attributes
    if (isNil(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isNil(childCareCategoryId)) throw new Error("Child Care category ID is required")
    if (isNil(monthlyAmount)) throw new Error("Monthly amount is required")

    const category = await QualityEnhancementCategory.create({
      fundingPeriodId,
      childCareCategoryId,
      monthlyAmount,
    })
    return category.reload({ include: ["childCareCategory"] })
  }
}

export default CreateService
