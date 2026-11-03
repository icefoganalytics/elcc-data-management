import { DiverseNeed } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private record: DiverseNeed) {
    super()
  }
  async perform(): Promise<void> {
    await this.record.destroy()
  }
}
