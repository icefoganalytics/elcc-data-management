import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { AdministrationCost, User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class AdministrationCostPolicy extends PolicyFactory(AdministrationCost) {
  show(): boolean {
    return true
  }

  update(): boolean {
    return true
  }

  permittedAttributes(): Path[] {
    return ["estimatedChildOccupancyRate", "actualChildOccupancyRate"]
  }

  static policyScope(_user: User): FindOptions<Attributes<AdministrationCost>> {
    return ALL_RECORDS_SCOPE
  }
}

export default AdministrationCostPolicy
