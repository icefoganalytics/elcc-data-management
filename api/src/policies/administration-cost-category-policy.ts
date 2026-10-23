import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { AdministrationCostCategory, type User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class AdministrationCostCategoryPolicy extends PolicyFactory(AdministrationCostCategory) {
  show(): boolean {
    return true
  }

  create(): boolean {
    return this.user.isSystemAdmin
  }

  update(): boolean {
    return this.user.isSystemAdmin
  }

  destroy(): boolean {
    return this.user.isSystemAdmin
  }

  permittedAttributes(): Path[] {
    return ["childCareSpaceCategoryId", "categoryName", "fromAge", "toAge", "monthlyAmount"]
  }

  permittedAttributesForCreate(): Path[] {
    return ["fundingPeriodId", ...this.permittedAttributes()]
  }

  static policyScope(_user: User): FindOptions<Attributes<AdministrationCostCategory>> {
    return ALL_RECORDS_SCOPE
  }
}

export default AdministrationCostCategoryPolicy
