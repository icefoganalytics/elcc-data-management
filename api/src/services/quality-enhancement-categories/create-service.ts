import { type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import db from "@/db/db-client"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"

export type QualityEnhancementCategoryCreationAttributes = Partial<
  CreationAttributes<QualityEnhancementCategory>
>

export class CreateService extends BaseService {
  constructor(private attributes: QualityEnhancementCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<QualityEnhancementCategory> {
    const { fundingPeriodId, categoryName, monthlyAmount, childCareSpaceCategoryId } =
      this.attributes
    if (isNil(fundingPeriodId) || isNil(categoryName) || isNil(monthlyAmount)) {
      throw new Error("Funding period, category name, and monthly amount are required")
    }

    return db.transaction(async (transaction) => {
      if (childCareSpaceCategoryId != null) {
        const spaceCategory = await ChildCareSpaceCategory.findOne({
          where: { id: childCareSpaceCategoryId, deletedAt: null },
          include: [{ association: "fundingPeriod", where: { id: fundingPeriodId } }],
          transaction,
        })
        if (!spaceCategory)
          throw new Error("Child Care Space category must belong to the same funding period")
      }

      return QualityEnhancementCategory.create(
        {
          ...this.attributes,
          fundingPeriodId,
          categoryName,
          monthlyAmount,
          fromAge: this.attributes.fromAge ?? null,
          toAge: this.attributes.toAge ?? null,
          childCareSpaceCategoryId: childCareSpaceCategoryId ?? null,
        },
        { transaction }
      )
    })
  }
}

export default CreateService
