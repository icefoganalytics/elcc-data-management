import { isNil } from "lodash"

import { Centre, ChildCareSpace, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import { Centres } from "@/services"
import { AdministrationCosts, ChildCareSpaces } from "@/services/centres/funding-periods"

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
    const historicalChildCareSpace = await ChildCareSpace.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findOne({
      attributes: ["id"],
      where: { centreId: this.centre.id },
      paranoid: false,
    })
    const isInitialProvisioning =
      !initializationStatus.hasEmployeeBenefits &&
      !initializationStatus.hasBuildingExpenses &&
      !initializationStatus.hasFundingSubmissionLineJsons &&
      !initializationStatus.hasFundingReconciliation &&
      !initializationStatus.hasAdministrationCosts &&
      isNil(historicalChildCareSpace)

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
    await AdministrationCosts.BulkEnsureService.perform(
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
