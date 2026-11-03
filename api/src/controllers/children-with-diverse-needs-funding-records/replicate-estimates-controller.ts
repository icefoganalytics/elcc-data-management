import { isNil } from "lodash"
import logger from "@/utils/logger"
import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import { ChildrenWithDiverseNeedsFundingRecordPolicy } from "@/policies"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/children-with-diverse-needs-funding-records"

export class ReplicateEstimatesController extends BaseController<ChildrenWithDiverseNeedsFundingRecord> {
  async create() {
    try {
      const record = await ChildrenWithDiverseNeedsFundingRecord.findByPk(
        this.params.childrenWithDiverseNeedsFundingRecordId
      )
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need not found" })
      const policy = new ChildrenWithDiverseNeedsFundingRecordPolicy(this.currentUser, record)
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
