import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { ChildCareSpace, User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class ChildCareSpacePolicy extends PolicyFactory(ChildCareSpace) {
  show(): boolean {
    return true
  }

  update(): boolean {
    return true
  }

  permittedAttributes(): Path[] {
    return ["estimatedChildOccupancyRate", "actualChildOccupancyRate"]
  }

  static policyScope(_user: User): FindOptions<Attributes<ChildCareSpace>> {
    return ALL_RECORDS_SCOPE
  }
}

export default ChildCareSpacePolicy
