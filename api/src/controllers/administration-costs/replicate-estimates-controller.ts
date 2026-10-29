import { isNil } from "lodash"

import logger from "@/utils/logger"
import { AdministrationCost } from "@/models"
import { AdministrationCostPolicy } from "@/policies"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/administration-costs"

export class ReplicateEstimatesController extends BaseController<AdministrationCost> {
  async create() {
    try {
      const administrationCost = await this.loadAdministrationCost()
      if (isNil(administrationCost)) {
        return this.response.status(404).json({
          message: "Administration cost not found",
        })
      }

      const policy = this.buildPolicy(administrationCost)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to replicate administration cost estimates",
        })
      }

      await ReplicateEstimatesService.perform(administrationCost)
      return this.response.status(201).json({
        message: "Replicated administration cost estimates to later fiscal periods.",
      })
    } catch (error) {
      logger.error(`Error replicating administration cost estimates: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error replicating administration cost estimates: ${error}`,
      })
    }
  }

  private loadAdministrationCost() {
    return AdministrationCost.findByPk(this.params.administrationCostId)
  }

  private buildPolicy(administrationCost: AdministrationCost = AdministrationCost.build()) {
    return new AdministrationCostPolicy(this.currentUser, administrationCost)
  }
}

export default ReplicateEstimatesController
