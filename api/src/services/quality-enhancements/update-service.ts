import { IsolationLevel, type Attributes } from "@sequelize/core"

import db from "@/db/db-client"
import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"

export type QualityEnhancementUpdateAttributes = Pick<
  Attributes<QualityEnhancement>,
  "estimatedChildOccupancyRate" | "actualChildOccupancyRate"
>

export class UpdateService extends BaseService {
  constructor(
    private qualityEnhancement: QualityEnhancement,
    private attributes: Partial<QualityEnhancementUpdateAttributes>
  ) {
    super()
  }

  async perform(): Promise<QualityEnhancement> {
    return db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        await this.qualityEnhancement.reload({ transaction })
        await this.qualityEnhancement.update(this.attributes, { transaction })
        return this.qualityEnhancement.reload({ transaction })
      }
    )
  }
}

export default UpdateService
