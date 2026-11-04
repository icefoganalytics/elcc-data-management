import type { Attributes } from "@sequelize/core"

import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes = Pick<
  Attributes<ChildrenWithDiverseNeedsFundingCategory>,
  "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
>

export class UpdateService extends BaseService {
  constructor(
    private childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategory,
    private attributes: Partial<ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes>
  ) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory> {
    return this.childrenWithDiverseNeedsFundingCategory.update(this.attributes)
  }
}
