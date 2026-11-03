import { isNil } from "lodash"
import logger from "@/utils/logger"
import { DiverseNeed } from "@/models"
import { DiverseNeedPolicy } from "@/policies"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/diverse-needs"

export class ReplicateEstimatesController extends BaseController<DiverseNeed> {
  async create() {
    try {
      const record = await DiverseNeed.findByPk(this.params.diverseNeedId)
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need not found" })
      const policy = new DiverseNeedPolicy(this.currentUser, record)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to replicate Diverse Need estimates" })
      await ReplicateEstimatesService.perform(record)
      return this.response
        .status(201)
        .json({ message: "Replicated Diverse Need estimates to later fiscal periods." })
    } catch (error) {
      logger.error(`Error replicating Diverse Need estimates: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error replicating Diverse Need estimates: ${error}` })
    }
  }
}
