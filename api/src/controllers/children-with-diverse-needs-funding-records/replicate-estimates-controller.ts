import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import { ChildrenWithDiverseNeedsFundingRecordPolicy } from "@/policies"
import BaseController from "@/controllers/base-controller"
import { ReplicateEstimatesService } from "@/services/children-with-diverse-needs-funding-records"
import logger from "@/utils/logger"

export class ReplicateEstimatesController extends BaseController<ChildrenWithDiverseNeedsFundingRecord> {
  async create() {
    try {
      const fundingRecord = await ChildrenWithDiverseNeedsFundingRecord.findByPk(
        this.params.childrenWithDiverseNeedsFundingRecordId
      )
      if (isNil(fundingRecord)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding record not found",
        })
      }

      const policy = new ChildrenWithDiverseNeedsFundingRecordPolicy(
        this.currentUser,
        fundingRecord
      )
      if (!policy.update()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to replicate Children with Diverse Needs funding estimates",
        })
      }

      await ReplicateEstimatesService.perform(fundingRecord)
      return this.response.status(201).json({
        message:
          "Replicated Children with Diverse Needs funding estimates to later fiscal periods.",
      })
    } catch (error) {
      logger.error(`Error replicating Children with Diverse Needs funding estimates: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error replicating Children with Diverse Needs funding estimates: ${error}`,
      })
    }
  }
}
