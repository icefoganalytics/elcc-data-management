import { isNil } from "lodash"
import BaseController from "@/controllers/base-controller"
import logger from "@/utils/logger"
import { ChildrenWithDiverseNeedsFundingRecord } from "@/models"
import { ChildrenWithDiverseNeedsFundingRecordsPolicy } from "@/policies"
import {
  CreateService,
  DestroyService,
  UpdateService,
} from "@/services/children-with-diverse-needs-funding-records"
import {
  IndexSerializer,
  ShowSerializer,
} from "@/serializers/children-with-diverse-needs-funding-records"

export class ChildrenWithDiverseNeedsFundingRecordsController extends BaseController<ChildrenWithDiverseNeedsFundingRecord> {
  async index() {
    try {
      const where = this.buildWhere()
      const scoped = ChildrenWithDiverseNeedsFundingRecordsPolicy.applyScope(
        this.buildFilterScopes(),
        this.currentUser
      )
      const totalCount = await scoped.count({ where })
      const records = await scoped.findAll({
        where,
        order: this.buildOrder([
          ["lineName", "ASC"],
          ["id", "ASC"],
        ]),
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      return this.response.json({
        childrenWithDiverseNeedsFundingRecords: IndexSerializer.perform(records, this.currentUser),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Children with Diverse Needs: ${error}` })
    }
  }
  async show() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Children with Diverse Needs not found" })
      const policy = this.buildPolicy(record)
      if (!policy.show())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to view this Children with Diverse Needs" })
      return this.response.json({
        childrenWithDiverseNeedsFundingRecord: ShowSerializer.perform(record),
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Children with Diverse Needs: ${error}` })
    }
  }
  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to create Children with Diverse Needs" })
      const record = await CreateService.perform(
        policy.permitAttributesForCreate(this.request.body)
      )
      return this.response
        .status(201)
        .json({ childrenWithDiverseNeedsFundingRecord: ShowSerializer.perform(record), policy })
    } catch (error) {
      logger.error(`Error creating Children with Diverse Needs: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error creating Children with Diverse Needs: ${error}` })
    }
  }
  async update() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Children with Diverse Needs not found" })
      const policy = this.buildPolicy(record)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this Children with Diverse Needs" })
      const updated = await UpdateService.perform(
        record,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({
        childrenWithDiverseNeedsFundingRecord: ShowSerializer.perform(updated),
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Children with Diverse Needs: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error updating Children with Diverse Needs: ${error}` })
    }
  }
  async destroy() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Children with Diverse Needs not found" })
      const policy = this.buildPolicy(record)
      if (!policy.destroy())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to delete this Children with Diverse Needs" })
      await DestroyService.perform(record)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Children with Diverse Needs: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error deleting Children with Diverse Needs: ${error}` })
    }
  }
  private load() {
    return ChildrenWithDiverseNeedsFundingRecord.findByPk(
      this.params.childrenWithDiverseNeedsFundingRecordId
    )
  }
  private buildPolicy(
    record: ChildrenWithDiverseNeedsFundingRecord = ChildrenWithDiverseNeedsFundingRecord.build()
  ) {
    return new ChildrenWithDiverseNeedsFundingRecordsPolicy(this.currentUser, record)
  }
}
