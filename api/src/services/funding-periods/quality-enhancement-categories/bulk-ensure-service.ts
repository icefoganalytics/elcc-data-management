import { isNil } from "lodash"

import FundingPeriod from "@/models/funding-period"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/funding-periods/quality-enhancement-categories/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<QualityEnhancementCategory[]> {
    const historicalCategory = await QualityEnhancementCategory.findOne({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      paranoid: false,
    })
    if (isNil(historicalCategory)) await BulkCreateService.perform(this.fundingPeriod)
    return QualityEnhancementCategory.findAll({ where: { fundingPeriodId: this.fundingPeriod.id } })
  }
}

export default BulkEnsureService
