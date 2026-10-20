import db, {
  BuildingExpense,
  AdministrationCost,
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
    const { id: centreId } = this.centre
    await db.transaction(async () => {
      await this.destroyDependentEntities(centreId)

      await this.centre.destroy()

      await this.logCentreDestruction(this.centre, this.currentUser)
    })
  }

  private async destroyDependentEntities(centreId: number) {
    await this.destroyDependentBuildingExpenses()
    await this.destroyDependentChildCareSpaces(centreId)
    await this.destroyDependentAdministrationCosts(centreId)
    await this.destroyDependentEmployeeBenefits()
    await this.destroyDependentFundingSubmissionLineJsons()
    await this.destroyDependentPayments()
    await this.destroyDependentWageEnhancements()
    await this.destroyDependentFundingReconciliations()
  }

  private async destroyDependentBuildingExpenses() {
    await BuildingExpense.destroy({
      where: {
        centreId: this.centre.id,
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
      where: { centreId },
    })
  }

  private async destroyDependentEmployeeBenefits() {
    await EmployeeBenefit.destroy({
      where: {
        centreId: this.centre.id,
      },
    })
  }

  private async destroyDependentFundingSubmissionLineJsons() {
    await FundingSubmissionLineJson.destroy({
      where: {
        centreId: this.centre.id,
      },
    })
  }

  private async destroyDependentPayments() {
    await Payment.destroy({
      where: {
        centreId: this.centre.id,
      },
    })
  }

  private async destroyDependentWageEnhancements() {
    await WageEnhancement.destroy({
      where: {
        centreId: this.centre.id,
      },
    })
  }

  private async destroyDependentFundingReconciliations() {
    await FundingReconciliation.findEach(
      {
        where: {
          centreId: this.centre.id,
        },
      },
      async (fundingReconciliation) => {
        await FundingReconciliations.DestroyService.perform(fundingReconciliation, this.currentUser)
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
