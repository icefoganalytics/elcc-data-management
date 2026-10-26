import { Centre, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import * as AdministrationCosts from "@/services/centres/funding-periods/administration-costs"
import * as BuildingExpenses from "@/services/centres/funding-periods/building-expenses"
import * as ChildCareSpaces from "@/services/centres/funding-periods/child-care-spaces"
import * as EmployeeBenefits from "@/services/centres/funding-periods/employee-benefits"
import { EnsureService as FundingReconciliationEnsureService } from "@/services/centres/funding-periods/funding-reconciliations/ensure-service"
import * as FundingSubmissionLineJsons from "@/services/centres/funding-periods/funding-submission-line-jsons"
import { IsInitializedService } from "@/services/centres/funding-periods/is-initialized-service"

export class EnsureChildrenService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<void> {
    const initializationStatus = await IsInitializedService.perform(this.centre, this.fundingPeriod)
    const isInitialProvisioning =
      !initializationStatus.hasEmployeeBenefits &&
      !initializationStatus.hasBuildingExpenses &&
      !initializationStatus.hasFundingSubmissionLineJsons &&
      !initializationStatus.hasFundingReconciliation
    await EmployeeBenefits.BulkEnsureService.perform(this.centre, this.fundingPeriod)
    await BuildingExpenses.BulkEnsureService.perform(this.centre, this.fundingPeriod)
    await ChildCareSpaces.BulkEnsureService.perform(
      this.centre,
      this.fundingPeriod,
      isInitialProvisioning
    )
    await AdministrationCosts.BulkEnsureService.perform(
      this.centre,
      this.fundingPeriod,
      isInitialProvisioning
    )
    await FundingSubmissionLineJsons.BulkEnsureService.perform(this.centre, this.fundingPeriod)
    await FundingReconciliationEnsureService.perform(this.centre, this.fundingPeriod)
  }
}

export default EnsureChildrenService
