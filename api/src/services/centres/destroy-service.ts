import db, {
  AdministrationCost,
  BuildingExpense,
  Centre,
  ChildCareSpace,
  EmployeeBenefit,
  FundingReconciliation,
  FundingSubmissionLineJson,
  Log,
  Payment,
  User,
  WageEnhancement,
} from "@/models"
import BaseService from "@/services/base-service"
import { FundingReconciliations } from "@/services"
import LogServices from "@/services/log-services"

export class DestroyService extends BaseService {
  constructor(
    private centre: Centre,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(async () => {
      await this.destroyDependentEntities(this.centre.id, this.currentUser)

      await this.centre.destroy()

      await this.logCentreDestruction(this.centre, this.currentUser)
    })
  }

  private async destroyDependentEntities(centreId: number, currentUser: User) {
    await this.destroyDependentBuildingExpenses(centreId)
    await this.destroyDependentChildCareSpaces(centreId)
    await this.destroyDependentAdministrationCosts(centreId)
    await this.destroyDependentEmployeeBenefits(centreId)
    await this.destroyDependentFundingSubmissionLineJsons(centreId)
    await this.destroyDependentPayments(centreId)
    await this.destroyDependentWageEnhancements(centreId)
    await this.destroyDependentFundingReconciliations(centreId, currentUser)
  }

  private async destroyDependentBuildingExpenses(centreId: number) {
    await BuildingExpense.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentChildCareSpaces(centreId: number) {
    await ChildCareSpace.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentAdministrationCosts(centreId: number) {
    await AdministrationCost.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentEmployeeBenefits(centreId: number) {
    await EmployeeBenefit.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentFundingSubmissionLineJsons(centreId: number) {
    await FundingSubmissionLineJson.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentPayments(centreId: number) {
    await Payment.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentWageEnhancements(centreId: number) {
    await WageEnhancement.destroy({
      where: {
        centreId,
      },
    })
  }

  private async destroyDependentFundingReconciliations(centreId: number, currentUser: User) {
    await FundingReconciliation.findEach(
      {
        where: {
          centreId,
        },
      },
      async (fundingReconciliation) => {
        await FundingReconciliations.DestroyService.perform(fundingReconciliation, currentUser)
      }
    )
  }

  private async logCentreDestruction(centre: Centre, currentUser: User) {
    // TODO: update log services to newer service pattern.
    await LogServices.create({
      model: centre,
      currentUser,
      operation: Log.OperationTypes.DELETE,
    })
  }
}

export default DestroyService
