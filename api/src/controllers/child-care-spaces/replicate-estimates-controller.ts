import { isNil } from "lodash"

import { ChildCareSpace } from "@/models"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/child-care-spaces"

export class ReplicateEstimatesController extends BaseController {
  async create() {
    try {
      const childCareSpace = await this.loadChildCareSpace()
      if (isNil(childCareSpace)) {
        return this.response.status(404).json({
          message: "Child Care Space not found",
        })
      }

      await ReplicateEstimatesService.perform(childCareSpace)
      return this.response.status(201).json({
        message: "Replicated Child Care Spaces estimates to later fiscal periods.",
      })
    } catch (error) {
      return this.response.status(422).json({
        message: `Error replicating Child Care Spaces estimates: ${error}`,
      })
    }
  }

  private loadChildCareSpace() {
    return ChildCareSpace.findByPk(this.params.childCareSpaceId)
  }
}

export default ReplicateEstimatesController
