import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, FundingPeriod } from "@/models"
import { FundingPeriods } from "@/services"
import BaseService from "@/services/base-service"

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

    return FundingPeriods.ChildrenWithDiverseNeedsFundingCategories.BulkCreateService.perform(
      this.fundingPeriod
    )
  }
}

export default BulkEnsureService
