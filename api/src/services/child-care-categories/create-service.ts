import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildCareCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildCareCategoryCreationAttributes = Partial<
  Pick<
    CreationAttributes<ChildCareCategory>,
    "fundingPeriodId" | "categoryName" | "fromAge" | "toAge"
  >
>

export class CreateService extends BaseService {
  constructor(private attributes: ChildCareCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<ChildCareCategory> {
    const { fundingPeriodId, categoryName, fromAge, toAge } = this.attributes
    if (isNil(fundingPeriodId)) throw new Error("Funding period ID is required")
    if (isNil(categoryName)) throw new Error("Category name is required")

    return ChildCareCategory.create({
      fundingPeriodId,
      categoryName,
      fromAge: fromAge ?? null,
      toAge: toAge ?? null,
    })
  }
}

export default CreateService
