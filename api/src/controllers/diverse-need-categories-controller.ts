import { isNil } from "lodash"
import BaseController from "@/controllers/base-controller"
import logger from "@/utils/logger"
import { DiverseNeedCategory } from "@/models"
import { DiverseNeedCategoryPolicy } from "@/policies"
import { CreateService, DestroyService, UpdateService } from "@/services/diverse-need-categories"
import { IndexSerializer, ShowSerializer } from "@/serializers/diverse-need-categories"

export class DiverseNeedCategoriesController extends BaseController<DiverseNeedCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scoped = DiverseNeedCategoryPolicy.applyScope(
        this.buildFilterScopes(),
        this.currentUser
      )
      const totalCount = await scoped.count({ where })
      const records = await scoped.findAll({
        where,
        order: this.buildOrder([
          ["categoryName", "ASC"],
          ["id", "ASC"],
        ]),
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      return this.response.json({
        diverseNeedCategories: IndexSerializer.perform(records, this.currentUser),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching diverse need categories: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching diverse need categories: ${error}` })
    }
  }
  async show() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need category not found" })
      const policy = this.buildPolicy(record)
      if (!policy.show())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to view this category" })
      return this.response.json({ diverseNeedCategory: ShowSerializer.perform(record), policy })
    } catch (error) {
      logger.error(`Error fetching diverse need category: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching diverse need category: ${error}` })
    }
  }
  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to create categories" })
      const record = await CreateService.perform(
        policy.permitAttributesForCreate(this.request.body)
      )
      return this.response
        .status(201)
        .json({ diverseNeedCategory: ShowSerializer.perform(record), policy })
    } catch (error) {
      logger.error(`Error creating diverse need category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error creating diverse need category: ${error}` })
    }
  }
  async update() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need category not found" })
      const policy = this.buildPolicy(record)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this category" })
      const updated = await UpdateService.perform(
        record,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({ diverseNeedCategory: ShowSerializer.perform(updated), policy })
    } catch (error) {
      logger.error(`Error updating diverse need category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error updating diverse need category: ${error}` })
    }
  }
  async destroy() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response.status(404).json({ message: "Diverse Need category not found" })
      const policy = this.buildPolicy(record)
      if (!policy.destroy())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to delete this category" })
      await DestroyService.perform(record)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting diverse need category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error deleting diverse need category: ${error}` })
    }
  }
  private load() {
    return DiverseNeedCategory.findByPk(this.params.diverseNeedCategoryId)
  }
  private buildPolicy(record: DiverseNeedCategory = DiverseNeedCategory.build()) {
    return new DiverseNeedCategoryPolicy(this.currentUser, record)
  }
}
