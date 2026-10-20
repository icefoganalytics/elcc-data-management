import { isNil } from "lodash"

import logger from "@/utils/logger"
import { ChildCareSpace } from "@/models"
import { ChildCareSpacePolicy } from "@/policies"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/child-care-spaces"

export class ReplicateEstimatesController extends BaseController<ChildCareSpace> {
  async create() {
    try {
      const childCareSpace = await this.loadChildCareSpace()
      if (isNil(childCareSpace)) {
        return this.response.status(404).json({
          message: "Child Care Space not found",
        })
      }

      const policy = this.buildPolicy(childCareSpace)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to replicate Child Care Spaces estimates",
        })
      }

      await ReplicateEstimatesService.perform(childCareSpace)
      return this.response.status(201).json({
        message: "Replicated Child Care Spaces estimates to later fiscal periods.",
      })
    } catch (error) {
      logger.error(`Error replicating Child Care Spaces estimates: ${error}`, { error })
      return this.response.status(422).json({
        message: `Error replicating Child Care Spaces estimates: ${error}`,
      })
    }
  }

  private loadChildCareSpace() {
    return ChildCareSpace.findByPk(this.params.childCareSpaceId)
  }

  private buildPolicy(childCareSpace: ChildCareSpace = ChildCareSpace.build()) {
    return new ChildCareSpacePolicy(this.currentUser, childCareSpace)
  }
}

export default ReplicateEstimatesController
