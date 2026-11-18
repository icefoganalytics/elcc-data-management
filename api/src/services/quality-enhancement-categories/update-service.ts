import { type Attributes } from "@sequelize/core"

import { QualityEnhancementCategory } from "@/models"
import BaseService from "@/services/base-service"

export type QualityEnhancementCategoryUpdateAttributes = Partial<
  Pick<Attributes<QualityEnhancementCategory>, "monthlyAmount">
>

export class UpdateService extends BaseService {
  constructor(
    private category: QualityEnhancementCategory,
    private attributes: QualityEnhancementCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<QualityEnhancementCategory> {
    await this.category.update({ monthlyAmount: this.attributes.monthlyAmount })
    return this.category.reload({ include: ["childCareCategory"] })
  }
}

export default UpdateService
