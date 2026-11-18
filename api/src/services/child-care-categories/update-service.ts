import { type Attributes } from "@sequelize/core"
import { pick } from "lodash"

import { ChildCareCategory } from "@/models"
import BaseService from "@/services/base-service"

export type ChildCareCategoryUpdateAttributes = Partial<
  Pick<Attributes<ChildCareCategory>, "categoryName" | "fromAge" | "toAge">
>

export class UpdateService extends BaseService {
  constructor(
    private category: ChildCareCategory,
    private attributes: ChildCareCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<ChildCareCategory> {
    return this.category.update(pick(this.attributes, ["categoryName", "fromAge", "toAge"]))
  }
}

export default UpdateService
