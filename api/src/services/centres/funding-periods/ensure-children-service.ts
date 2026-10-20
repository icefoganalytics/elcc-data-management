import { Centre, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import { Centres } from "@/services"
import { ChildCareSpaces } from "@/services/centres/funding-periods"

export class EnsureChildrenService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<void> {
    const initializationStatus = await Centres.FundingPeriods.IsInitializedService.perform(
      this.centre,
      this.fundingPeriod
    )
    const isInitialProvisioning =
      !initializationStatus.hasEmployeeBenefits &&
      !initializationStatus.hasBuildingExpenses &&
      !initializationStatus.hasFundingSubmissionLineJsons &&
      !initializationStatus.hasFundingReconciliation

    await Centres.FundingPeriods.EmployeeBenefits.BulkEnsureService.perform(
      this.centre,
      this.fundingPeriod
    )
    await Centres.FundingPeriods.BuildingExpenses.BulkEnsureService.perform(
      this.centre,
      this.fundingPeriod
    )
    await ChildCareSpaces.BulkEnsureService.perform(
      this.centre,
      this.fundingPeriod,
      isInitialProvisioning
    )
    await Centres.FundingPeriods.FundingSubmissionLineJsons.BulkEnsureService.perform(
      this.centre,
      this.fundingPeriod
    )
    await Centres.FundingPeriods.FundingReconciliations.EnsureService.perform(
      this.centre,
      this.fundingPeriod
    )
  }
}

export default EnsureChildrenService
