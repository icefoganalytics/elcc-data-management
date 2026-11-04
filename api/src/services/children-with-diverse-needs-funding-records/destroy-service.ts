import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(
    private childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecord
  ) {
    super()
  }

  async perform(): Promise<void> {
    await this.childrenWithDiverseNeedsFundingRecord.destroy()
  }
}
