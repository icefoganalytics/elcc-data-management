import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private category: QualityEnhancementCategory) {
    super()
  }

  async perform(): Promise<void> {
    await this.category.destroy()
  }
}

export default DestroyService
