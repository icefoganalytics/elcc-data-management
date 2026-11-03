import { isEmpty } from "lodash"

import { DiverseNeedCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/funding-periods/diverse-need-categories/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<DiverseNeedCategory[]> {
    const historicalCategories = await DiverseNeedCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      paranoid: false,
    })
    if (!isEmpty(historicalCategories)) {
      return DiverseNeedCategory.findAll({ where: { fundingPeriodId: this.fundingPeriod.id } })
    }

    return BulkCreateService.perform(this.fundingPeriod)
  }
}

export default BulkEnsureService
