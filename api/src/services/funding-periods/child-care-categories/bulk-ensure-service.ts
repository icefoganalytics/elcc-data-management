import { ChildCareCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/funding-periods/child-care-categories/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildCareCategory[]> {
    const history = await ChildCareCategory.findOne({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      paranoid: false,
    })
    if (!history) return BulkCreateService.perform(this.fundingPeriod)

    return ChildCareCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
  }
}

export default BulkEnsureService
