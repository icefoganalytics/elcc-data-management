import {
  AdministrationCost,
  AdministrationCostCategory,
  ChildCareSpace,
  ChildCareSpaceCategory,
  FundingSubmissionLine,
  QualityEnhancement,
  QualityEnhancementCategory,
} from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private childCareSpaceCategory: ChildCareSpaceCategory) {
    super()
  }

  async perform(): Promise<void> {
    const childCareSpacesUsingCategory = await ChildCareSpace.count({
      where: {
        categoryId: this.childCareSpaceCategory.id,
      },
    })
    if (childCareSpacesUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Child Care Space records")
    }

    const administrationCostCategoriesUsingCategory = await AdministrationCostCategory.count({
      where: {
        childCareSpaceCategoryId: this.childCareSpaceCategory.id,
      },
    })
    if (administrationCostCategoriesUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Administration Cost categories")
    }

    const qualityEnhancementCategoriesUsingCategory = await QualityEnhancementCategory.count({
      where: {
        childCareSpaceCategoryId: this.childCareSpaceCategory.id,
      },
    })
    if (qualityEnhancementCategoriesUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Quality Enhancement categories")
    }

    const administrationCostsUsingCategory = await AdministrationCost.count({
      where: {
        childCareSpaceCategoryId: this.childCareSpaceCategory.id,
      },
    })
    if (administrationCostsUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Administration Cost records")
    }

    const qualityEnhancementsUsingCategory = await QualityEnhancement.count({
      where: {
        childCareSpaceCategoryId: this.childCareSpaceCategory.id,
      },
    })
    if (qualityEnhancementsUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Quality Enhancement records")
    }

    const fundingSubmissionLinesUsingCategory = await FundingSubmissionLine.count({
      where: {
        childCareSpaceCategoryId: this.childCareSpaceCategory.id,
      },
    })
    if (fundingSubmissionLinesUsingCategory > 0) {
      throw new Error("Cannot delete a category used by funding submission lines")
    }

    await this.childCareSpaceCategory.destroy()
  }
}

export default DestroyService
