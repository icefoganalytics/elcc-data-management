import {
  ChildrenWithDiverseNeedsFundingCategory,
  ChildrenWithDiverseNeedsFundingRecord,
} from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(
    private childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategory
  ) {
    super()
  }

  async perform(): Promise<void> {
    const fundingRecordsUsingCategory = await ChildrenWithDiverseNeedsFundingRecord.count({
      where: { categoryId: this.childrenWithDiverseNeedsFundingCategory.id },
    })
    if (fundingRecordsUsingCategory > 0) {
      throw new Error(
        "Cannot delete a category used by Children with Diverse Needs funding records"
      )
    }

    await this.childrenWithDiverseNeedsFundingCategory.destroy()
  }
}
