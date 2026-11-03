import {
  ChildrenWithDiverseNeedsFundingRecord,
  ChildrenWithDiverseNeedsFundingCategory,
} from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private record: ChildrenWithDiverseNeedsFundingCategory) {
    super()
  }
  async perform(): Promise<void> {
    const used = await ChildrenWithDiverseNeedsFundingRecord.count({
      where: { categoryId: this.record.id },
    })
    if (used > 0) throw new Error("Cannot delete a category used by diverse needs")
    await this.record.destroy()
  }
}
