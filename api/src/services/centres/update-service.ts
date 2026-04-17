import db, { Centre, Log, User } from "@/models"
import BaseService from "@/services/base-service"
import LogServices from "@/services/log-services"
import { FundingSubmissionLineJsons } from "@/services/centres/funding-periods"

export class UpdateService extends BaseService {
  constructor(
    private centre: Centre,
    private attributes: Partial<Centre>,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<Centre> {
    return db.transaction(async () => {
      const { hotMeal: hotMealOld } = this.centre
      await this.centre.update(this.attributes)
      const { hotMeal: hotMealNew } = this.centre

      await this.synchronizeHotMealEnhancement(this.centre, hotMealOld, hotMealNew)

      await this.logCentreCreation(this.centre, this.currentUser)

      return this.centre
    })
  }

  private async synchronizeHotMealEnhancement(
    centre: Centre,
    hotMealOld: boolean,
    hotMealNew: boolean
  ): Promise<void> {
    if (hotMealOld === false && hotMealNew === true) {
      await FundingSubmissionLineJsons.ApplyHotMealEnhancementService.perform(centre)
    } else if (hotMealOld === true && hotMealNew === false) {
      await FundingSubmissionLineJsons.RemoveHotMealEnhancementService.perform(centre)
    }
  }

  private async logCentreCreation(centre: Centre, currentUser: User) {
    // TODO: update log services to newer service pattern.
    await LogServices.create({
      model: centre,
      currentUser,
      operation: Log.OperationTypes.UPDATE,
    })
  }
}

export default UpdateService
