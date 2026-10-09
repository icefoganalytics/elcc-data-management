import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { ChildCareSpaceCategory, User } from "@/models"
import { PolicyFactory } from "@/policies/base-policy"

export class ChildCareSpaceCategoryPolicy extends PolicyFactory(ChildCareSpaceCategory) {
  show(): boolean {
    return true
  }
  create(): boolean {
    return true
  }
  update(): boolean {
    return true
  }
  destroy(): boolean {
    return true
  }
  permittedAttributes(): Path[] {
    return ["categoryName", "fromAge", "toAge", "monthlyAmount"]
  }
  permittedAttributesForCreate(): Path[] {
    return ["fundingPeriodId", ...this.permittedAttributes()]
  }
  static policyScope(_user: User): FindOptions<Attributes<ChildCareSpaceCategory>> {
    return {}
  }
}

export default ChildCareSpaceCategoryPolicy
