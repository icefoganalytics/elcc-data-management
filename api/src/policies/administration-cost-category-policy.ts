import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { AdministrationCostCategory, User } from "@/models"
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
    return ["monthlyAmount"]
  }

  permittedAttributesForCreate(): Path[] {
    return ["fundingPeriodId", "childCareCategoryId", ...this.permittedAttributes()]
  }

  static policyScope(_user: User): FindOptions<Attributes<AdministrationCostCategory>> {
    return { ...ALL_RECORDS_SCOPE, include: ["childCareCategory"] }
  }
}

export default AdministrationCostCategoryPolicy
