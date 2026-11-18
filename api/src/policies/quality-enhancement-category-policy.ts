import { type Attributes, type FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import User from "@/models/user"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class QualityEnhancementCategoryPolicy extends PolicyFactory(QualityEnhancementCategory) {
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

  static policyScope(_user: User): FindOptions<Attributes<QualityEnhancementCategory>> {
    return { ...ALL_RECORDS_SCOPE, include: ["childCareCategory"] }
  }
}

export default QualityEnhancementCategoryPolicy
