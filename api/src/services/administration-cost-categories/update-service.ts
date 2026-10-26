import { type Attributes } from "@sequelize/core"

import { AdministrationCostCategory } from "@/models"
import BaseService from "@/services/base-service"

export type AdministrationCostCategoryUpdateAttributes = Partial<
  Pick<
    Attributes<AdministrationCostCategory>,
    "childCareSpaceCategoryId" | "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
  >
>

export class UpdateService extends BaseService {
  constructor(
    private administrationCostCategory: AdministrationCostCategory,
    private attributes: AdministrationCostCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory> {
    await this.administrationCostCategory.update(this.attributes)
    return this.administrationCostCategory
  }
}

export default UpdateService
