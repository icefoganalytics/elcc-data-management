import { isNil } from "lodash"

import { AdministrationCostCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/funding-periods/administration-cost-categories/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory[]> {
    const categoryHistory = await AdministrationCostCategory.findOne({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      paranoid: false,
    })
    if (isNil(categoryHistory)) {
      return BulkCreateService.perform(this.fundingPeriod)
    }

    return AdministrationCostCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
  }
}

export default BulkEnsureService
