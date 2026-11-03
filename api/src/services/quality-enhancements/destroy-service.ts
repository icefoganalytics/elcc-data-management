import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private qualityEnhancement: QualityEnhancement) {
    super()
  }

  async perform(): Promise<void> {
    await this.qualityEnhancement.destroy()
  }
}

export default DestroyService
