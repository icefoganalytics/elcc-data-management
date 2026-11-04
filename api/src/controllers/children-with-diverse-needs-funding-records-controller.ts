import { isNil } from "lodash"

import BaseController from "@/controllers/base-controller"
import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import { ChildrenWithDiverseNeedsFundingRecordPolicy } from "@/policies"
import {
  CreateService,
  DestroyService,
  UpdateService,
} from "@/services/children-with-diverse-needs-funding-records"
import {
  IndexSerializer,
  ShowSerializer,
} from "@/serializers/children-with-diverse-needs-funding-records"
import logger from "@/utils/logger"

export class ChildrenWithDiverseNeedsFundingRecordsController extends BaseController<ChildrenWithDiverseNeedsFundingRecord> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopedFundingRecords = ChildrenWithDiverseNeedsFundingRecordPolicy.applyScope(
        this.buildFilterScopes(),
        this.currentUser
      )
      const totalCount = await scopedFundingRecords.count({ where })
      const fundingRecords = await scopedFundingRecords.findAll({
        where,
        order: this.buildOrder([
          ["lineName", "ASC"],
          ["id", "ASC"],
        ]),
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })

      return this.response.json({
        childrenWithDiverseNeedsFundingRecords: IndexSerializer.perform(
          fundingRecords,
          this.currentUser
        ),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs funding records: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching Children with Diverse Needs funding records: ${error}`,
      })
    }
  }

  async show() {
    try {
      const fundingRecord = await this.loadFundingRecord()
      if (isNil(fundingRecord)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding record not found",
        })
      }

      const policy = this.buildPolicy(fundingRecord)
      if (!policy.show()) {
        return this.response.status(403).json({
          message: "You are not authorized to view this Children with Diverse Needs funding record",
        })
      }

      return this.response.json({
        childrenWithDiverseNeedsFundingRecord: ShowSerializer.perform(fundingRecord),
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs funding record: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching Children with Diverse Needs funding record: ${error}`,
      })
    }
  }

  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create()) {
        return this.response.status(403).json({
          message: "You are not authorized to create Children with Diverse Needs funding records",
        })
      }

      const fundingRecord = await CreateService.perform(
        policy.permitAttributesForCreate(this.request.body)
      )
      return this.response.status(201).json({
        childrenWithDiverseNeedsFundingRecord: ShowSerializer.perform(fundingRecord),
        policy,
      })
    } catch (error) {
      logger.error(`Error creating Children with Diverse Needs funding record: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error creating Children with Diverse Needs funding record: ${error}`,
      })
    }
  }

  async update() {
    try {
      const fundingRecord = await this.loadFundingRecord()
      if (isNil(fundingRecord)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding record not found",
        })
      }

      const policy = this.buildPolicy(fundingRecord)
      if (!policy.update()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to update this Children with Diverse Needs funding record",
        })
      }

      const updatedFundingRecord = await UpdateService.perform(
        fundingRecord,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({
        childrenWithDiverseNeedsFundingRecord: ShowSerializer.perform(updatedFundingRecord),
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Children with Diverse Needs funding record: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error updating Children with Diverse Needs funding record: ${error}`,
      })
    }
  }

  async destroy() {
    try {
      const fundingRecord = await this.loadFundingRecord()
      if (isNil(fundingRecord)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding record not found",
        })
      }

      const policy = this.buildPolicy(fundingRecord)
      if (!policy.destroy()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to delete this Children with Diverse Needs funding record",
        })
      }

      await DestroyService.perform(fundingRecord)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Children with Diverse Needs funding record: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error deleting Children with Diverse Needs funding record: ${error}`,
      })
    }
  }

  private async loadFundingRecord(): Promise<ChildrenWithDiverseNeedsFundingRecord | null> {
    return ChildrenWithDiverseNeedsFundingRecord.findByPk(
      this.params.childrenWithDiverseNeedsFundingRecordId
    )
  }

  private buildPolicy(
    fundingRecord: ChildrenWithDiverseNeedsFundingRecord = ChildrenWithDiverseNeedsFundingRecord.build()
  ): ChildrenWithDiverseNeedsFundingRecordPolicy {
    return new ChildrenWithDiverseNeedsFundingRecordPolicy(this.currentUser, fundingRecord)
  }
}
