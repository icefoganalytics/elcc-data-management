import { FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import { FundingPeriods } from "@/services"

export class EnsureChildrenService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<void> {
    await FundingPeriods.FiscalPeriods.BulkCreateService.perform(this.fundingPeriod)
    await FundingPeriods.EmployeeWageTiers.BulkCreateService.perform(this.fundingPeriod)
    await FundingPeriods.ChildCareSpaceCategories.BulkEnsureService.perform(this.fundingPeriod)
    await FundingPeriods.FundingSubmissionLines.BulkEnsureService.perform(this.fundingPeriod)
  }
}

export default EnsureChildrenService
