import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(
    private childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategory
  ) {
    super()
  }

  async perform(): Promise<void> {
    await this.childrenWithDiverseNeedsFundingCategory.destroy()
  }
}
