import {
  ChildCareCategory,
  ChildCareSpaceCategory,
  AdministrationCostCategory,
  QualityEnhancementCategory,
} from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private category: ChildCareCategory) {
    super()
  }

  async perform(): Promise<void> {
    const childCareSpaceCategoriesUsingCategory = await ChildCareSpaceCategory.count({
      where: {
        childCareCategoryId: this.category.id,
      },
    })
    if (childCareSpaceCategoriesUsingCategory > 0) {
      throw new Error("Cannot delete a Child Care category with active program configurations")
    }

    const administrationCostCategoriesUsingCategory = await AdministrationCostCategory.count({
      where: {
        childCareCategoryId: this.category.id,
      },
    })
    if (administrationCostCategoriesUsingCategory > 0) {
      throw new Error("Cannot delete a Child Care category with active program configurations")
    }

    const qualityEnhancementCategoriesUsingCategory = await QualityEnhancementCategory.count({
      where: {
        childCareCategoryId: this.category.id,
      },
    })
    if (qualityEnhancementCategoriesUsingCategory > 0) {
      throw new Error("Cannot delete a Child Care category with active program configurations")
    }

    await this.category.destroy()
  }
}

export default DestroyService
