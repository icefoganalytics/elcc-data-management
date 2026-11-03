import type { Attributes } from "@sequelize/core"
import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import BaseService from "@/services/base-service"

type UpdateAttributes = Pick<
  Attributes<ChildrenWithDiverseNeedsFundingCategory>,
  "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
>

export class UpdateService extends BaseService {
  constructor(
    private record: ChildrenWithDiverseNeedsFundingCategory,
    private attributes: Partial<UpdateAttributes>
  ) {
    super()
  }
  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory> {
    return this.record.update(this.attributes)
  }
}
