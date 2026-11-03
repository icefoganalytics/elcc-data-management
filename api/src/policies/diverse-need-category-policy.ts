import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { DiverseNeedCategory, User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class DiverseNeedCategoryPolicy extends PolicyFactory(DiverseNeedCategory) {
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
    return ["categoryName", "fromAge", "toAge", "monthlyAmount"]
  }

  permittedAttributesForCreate(): Path[] {
    return ["fundingPeriodId", ...this.permittedAttributes()]
  }

  static policyScope(_user: User): FindOptions<Attributes<DiverseNeedCategory>> {
    return ALL_RECORDS_SCOPE
  }
}

export default DiverseNeedCategoryPolicy
