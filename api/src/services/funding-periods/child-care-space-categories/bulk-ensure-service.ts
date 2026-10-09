import { isNil } from "lodash"

import { ChildCareSpaceCategory, FundingPeriod } from "@/models"

import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/funding-periods/child-care-space-categories/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory[]> {
    const categoryHistory = await ChildCareSpaceCategory.findOne({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      paranoid: false,
    })
    if (isNil(categoryHistory)) return BulkCreateService.perform(this.fundingPeriod)

    return ChildCareSpaceCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
  }
}

export default BulkEnsureService
