import { isNil } from "lodash"
import BaseController from "@/controllers/base-controller"
import logger from "@/utils/logger"
import { DiverseNeed } from "@/models"
import { DiverseNeedPolicy } from "@/policies"
import { CreateService, DestroyService, UpdateService } from "@/services/diverse-needs"
import { IndexSerializer, ShowSerializer } from "@/serializers/diverse-needs"

export class DiverseNeedsController extends BaseController<DiverseNeed> {
  async index() {
    try {
      const where = this.buildWhere()
      const scoped = DiverseNeedPolicy.applyScope(this.buildFilterScopes(), this.currentUser)
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
        diverseNeeds: IndexSerializer.perform(records, this.currentUser),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching diverse needs: ${error}`, { error })
      return this.response.status(400).json({ message: `Error fetching diverse needs: ${error}` })
    }
  }
  async show() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need not found" })
      const policy = this.buildPolicy(record)
      if (!policy.show())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to view this Diverse Need" })
      return this.response.json({ diverseNeed: ShowSerializer.perform(record), policy })
    } catch (error) {
      logger.error(`Error fetching Diverse Need: ${error}`, { error })
      return this.response.status(400).json({ message: `Error fetching Diverse Need: ${error}` })
    }
  }
  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to create Diverse Needs" })
      const record = await CreateService.perform(
        policy.permitAttributesForCreate(this.request.body)
      )
      return this.response.status(201).json({ diverseNeed: ShowSerializer.perform(record), policy })
    } catch (error) {
      logger.error(`Error creating Diverse Need: ${error}`, { error })
      return this.response.status(422).json({ message: `Error creating Diverse Need: ${error}` })
    }
  }
  async update() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need not found" })
      const policy = this.buildPolicy(record)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this Diverse Need" })
      const updated = await UpdateService.perform(
        record,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({ diverseNeed: ShowSerializer.perform(updated), policy })
    } catch (error) {
      logger.error(`Error updating Diverse Need: ${error}`, { error })
      return this.response.status(422).json({ message: `Error updating Diverse Need: ${error}` })
    }
  }
  async destroy() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need not found" })
      const policy = this.buildPolicy(record)
      if (!policy.destroy())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to delete this Diverse Need" })
      await DestroyService.perform(record)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Diverse Need: ${error}`, { error })
      return this.response.status(422).json({ message: `Error deleting Diverse Need: ${error}` })
    }
  }
  private load() {
    return DiverseNeed.findByPk(this.params.diverseNeedId)
  }
  private buildPolicy(record: DiverseNeed = DiverseNeed.build()) {
    return new DiverseNeedPolicy(this.currentUser, record)
  }
}
