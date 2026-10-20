import { ChildCareSpaceCategory } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private category: ChildCareSpaceCategory) {
    super()
  }

  async perform(): Promise<void> {
    await this.category.destroy()
  }
}

export default DestroyService
