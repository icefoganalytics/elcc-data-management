import { isNil } from "lodash"

import logger from "@/utils/logger"
import QualityEnhancement from "@/models/quality-enhancement"
import QualityEnhancementPolicy from "@/policies/quality-enhancement-policy"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/quality-enhancements"

export class ReplicateEstimatesController extends BaseController<QualityEnhancement> {
  async create() {
    try {
      const qualityEnhancement = await QualityEnhancement.findByPk(this.params.qualityEnhancementId)
      if (isNil(qualityEnhancement)) {
        return this.response.status(404).json({ message: "Quality Enhancement not found" })
      }

      const policy = new QualityEnhancementPolicy(this.currentUser, qualityEnhancement)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to replicate Quality Enhancement estimates",
        })
      }

      await ReplicateEstimatesService.perform(qualityEnhancement)
      return this.response.status(201).json({
        message: "Replicated Quality Enhancement estimates to later fiscal periods.",
      })
    } catch (error) {
      logger.error(`Error replicating Quality Enhancement estimates: ${error}`, { error })
      return this.response.status(422).json({
        message: `Error replicating Quality Enhancement estimates: ${error}`,
      })
    }
  }
}

export default ReplicateEstimatesController
