import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import QualityEnhancement from "@/models/quality-enhancement"
import User from "@/models/user"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class QualityEnhancementPolicy extends PolicyFactory(QualityEnhancement) {
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
    return this.user.isSystemAdmin
  }

  permittedAttributes(): Path[] {
    return ["estimatedChildOccupancyRate", "actualChildOccupancyRate"]
  }

  permittedAttributesForCreate(): Path[] {
    return [
      "centreId",
      "fiscalPeriodId",
      "categoryId",
      "estimatedChildOccupancyRate",
      "actualChildOccupancyRate",
      "applyToCurrentAndFutureFiscalPeriods",
    ]
  }

  static policyScope(_user: User): FindOptions<Attributes<QualityEnhancement>> {
    return ALL_RECORDS_SCOPE
  }
}

export default QualityEnhancementPolicy
