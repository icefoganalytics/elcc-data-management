import { type Attributes } from "@sequelize/core"

import { ChildCareSpaceCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildCareSpaceCategoryUpdateAttributes = Partial<Attributes<ChildCareSpaceCategory>>

export class UpdateService extends BaseService {
  constructor(
    private category: ChildCareSpaceCategory,
    private attributes: ChildCareSpaceCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory> {
    const { fundingPeriodId: _ignoredFundingPeriodId, ...attributes } = this.attributes
    await this.category.update(attributes)
    return this.category
  }
}

export default UpdateService
