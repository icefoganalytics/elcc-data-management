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
    const where = { childCareCategoryId: this.category.id }
    const configuredSpaces = await ChildCareSpaceCategory.count({ where })
    const configuredAdministrationCosts = await AdministrationCostCategory.count({ where })
    const configuredQualityEnhancements = await QualityEnhancementCategory.count({ where })
    if (configuredSpaces + configuredAdministrationCosts + configuredQualityEnhancements > 0) {
      throw new Error("Cannot delete a Child Care category with active program configurations")
    }

    await this.category.destroy()
  }
}

export default DestroyService
