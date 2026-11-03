import type { Attributes } from "@sequelize/core"
import { DiverseNeedCategory } from "@/models"
import BaseService from "@/services/base-service"

type UpdateAttributes = Pick<
  Attributes<DiverseNeedCategory>,
  "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
>

export class UpdateService extends BaseService {
  constructor(
    private record: DiverseNeedCategory,
    private attributes: Partial<UpdateAttributes>
  ) {
    super()
  }
  async perform(): Promise<DiverseNeedCategory> {
    return this.record.update(this.attributes)
  }
}
