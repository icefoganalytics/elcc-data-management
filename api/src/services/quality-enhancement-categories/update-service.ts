import { type Attributes } from "@sequelize/core"

import db from "@/db/db-client"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"

export type QualityEnhancementCategoryUpdateAttributes = Pick<
  Attributes<QualityEnhancementCategory>,
  "categoryName" | "fromAge" | "toAge" | "monthlyAmount" | "childCareSpaceCategoryId"
>

export class UpdateService extends BaseService {
  constructor(
    private category: QualityEnhancementCategory,
    private attributes: Partial<QualityEnhancementCategoryUpdateAttributes>
  ) {
    super()
  }

  async perform(): Promise<QualityEnhancementCategory> {
    return db.transaction(async (transaction) => {
      await this.category.reload({ transaction })
      const childCareSpaceCategoryId = this.attributes.childCareSpaceCategoryId
      if (childCareSpaceCategoryId != null) {
        const matchingCategory = await ChildCareSpaceCategory.findOne({
          where: { id: childCareSpaceCategoryId, deletedAt: null },
          include: [{ association: "fundingPeriod", where: { id: this.category.fundingPeriodId } }],
          transaction,
        })
        if (!matchingCategory)
          throw new Error("Child Care Space category must belong to the same funding period")
      }

      await this.category.update(this.attributes, { transaction })
      return this.category.reload({ transaction })
    })
  }
}

export default UpdateService
