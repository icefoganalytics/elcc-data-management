import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/funding-periods/children-with-diverse-needs-funding-categories/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory[]> {
    const historicalCategory = await ChildrenWithDiverseNeedsFundingCategory.findOne({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      paranoid: false,
    })
    if (!isNil(historicalCategory)) {
      return ChildrenWithDiverseNeedsFundingCategory.findAll({
        where: { fundingPeriodId: this.fundingPeriod.id },
      })
    }

    return BulkCreateService.perform(this.fundingPeriod)
  }
}

export default BulkEnsureService
