import { QualityEnhancement, QualityEnhancementCategory } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private qualityEnhancementCategory: QualityEnhancementCategory) {
    super()
  }

  async perform(): Promise<void> {
    const qualityEnhancementsUsingCategory = await QualityEnhancement.count({
      where: {
        categoryId: this.qualityEnhancementCategory.id,
      },
    })
    if (qualityEnhancementsUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Quality Enhancement records")
    }

    await this.qualityEnhancementCategory.destroy()
  }
}

export default DestroyService
