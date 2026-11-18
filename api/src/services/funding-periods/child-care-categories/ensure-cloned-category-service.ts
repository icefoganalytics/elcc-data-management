import { ChildCareCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

// Sparse program history can reference a category absent from the newest catalogue.
export class EnsureClonedCategoryService extends BaseService {
  constructor(
    private sourceCategory: ChildCareCategory,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<ChildCareCategory | null> {
    const { categoryName, fromAge, toAge } = this.sourceCategory
    const targetCategory = await ChildCareCategory.findOne({
      where: { fundingPeriodId: this.fundingPeriod.id, categoryName },
    })
    if (targetCategory) {
      if (targetCategory.fromAge !== fromAge || targetCategory.toAge !== toAge) {
        throw new Error(
          `Conflicting Child Care category metadata: source ${this.sourceCategory.id}, target ${targetCategory.id}`
        )
      }
      return targetCategory
    }
    const retiredCategory = await ChildCareCategory.findOne({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id, categoryName },
      paranoid: false,
    })
    if (retiredCategory) return null

    return ChildCareCategory.create({
      fundingPeriodId: this.fundingPeriod.id,
      categoryName,
      fromAge,
      toAge,
    })
  }
}

export default EnsureClonedCategoryService
