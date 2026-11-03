import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { ChildrenWithDiverseNeedsFundingCategory, User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class ChildrenWithDiverseNeedsFundingCategoryPolicy extends PolicyFactory(
  ChildrenWithDiverseNeedsFundingCategory
) {
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

  static policyScope(_user: User): FindOptions<Attributes<ChildrenWithDiverseNeedsFundingCategory>> {
    return ALL_RECORDS_SCOPE
  }
}

export default ChildrenWithDiverseNeedsFundingCategoryPolicy
