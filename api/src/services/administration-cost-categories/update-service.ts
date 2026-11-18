import { type Attributes } from "@sequelize/core"

import { AdministrationCostCategory } from "@/models"
import BaseService from "@/services/base-service"

export type AdministrationCostCategoryUpdateAttributes = Partial<
  Pick<Attributes<AdministrationCostCategory>, "monthlyAmount">
>

export class UpdateService extends BaseService {
  constructor(
    private category: AdministrationCostCategory,
    private attributes: AdministrationCostCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory> {
    await this.category.update({ monthlyAmount: this.attributes.monthlyAmount })
    return this.category.reload({ include: ["childCareCategory"] })
  }
}

export default UpdateService
