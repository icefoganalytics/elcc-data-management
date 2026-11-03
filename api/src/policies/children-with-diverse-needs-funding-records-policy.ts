import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import { ChildrenWithDiverseNeedsFundingRecord, User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class ChildrenWithDiverseNeedsFundingRecordsPolicy extends PolicyFactory(ChildrenWithDiverseNeedsFundingRecord) {
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
      "applyToCurrentAndFutureFiscalPeriods",
      ...this.permittedAttributes(),
    ]
  }

  static policyScope(_user: User): FindOptions<Attributes<ChildrenWithDiverseNeedsFundingRecord>> {
    return ALL_RECORDS_SCOPE
  }
}

export default ChildrenWithDiverseNeedsFundingRecordsPolicy
