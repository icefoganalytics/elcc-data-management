import { FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import * as AdministrationCostCategories from "@/services/funding-periods/administration-cost-categories"
import * as ChildCareSpaceCategories from "@/services/funding-periods/child-care-space-categories"
import * as EmployeeWageTiers from "@/services/funding-periods/employee-wage-tiers"
import * as FiscalPeriods from "@/services/funding-periods/fiscal-periods"
import * as FundingSubmissionLines from "@/services/funding-periods/funding-submission-lines"

export class EnsureChildrenService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<void> {
    await FiscalPeriods.BulkCreateService.perform(this.fundingPeriod)
    await EmployeeWageTiers.BulkCreateService.perform(this.fundingPeriod)
    await ChildCareSpaceCategories.BulkEnsureService.perform(this.fundingPeriod)
    await AdministrationCostCategories.BulkEnsureService.perform(this.fundingPeriod)
    await FundingSubmissionLines.BulkEnsureService.perform(this.fundingPeriod)
  }
}

export default EnsureChildrenService
