import { FundingPeriod } from "@/models"
import { FundingPeriods } from "@/services"
import BaseService from "@/services/base-service"
import { ChildCareSpaceCategories, QualityEnhancementCategories } from "@/services/funding-periods"

export class EnsureChildrenService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<void> {
    await FundingPeriods.FiscalPeriods.BulkCreateService.perform(this.fundingPeriod)
    await FundingPeriods.EmployeeWageTiers.BulkCreateService.perform(this.fundingPeriod)
    await ChildCareSpaceCategories.BulkEnsureService.perform(this.fundingPeriod)
    await QualityEnhancementCategories.BulkEnsureService.perform(this.fundingPeriod)
    await FundingPeriods.AdministrationCostCategories.BulkEnsureService.perform(this.fundingPeriod)
    await FundingPeriods.FundingSubmissionLines.BulkEnsureService.perform(this.fundingPeriod)
  }
}

export default EnsureChildrenService
