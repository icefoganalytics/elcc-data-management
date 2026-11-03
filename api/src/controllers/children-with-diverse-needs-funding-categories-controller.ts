import { isNil } from "lodash"
import BaseController from "@/controllers/base-controller"
import logger from "@/utils/logger"
import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"
import { ChildrenWithDiverseNeedsFundingCategoryPolicy } from "@/policies"
import {
  CreateService,
  DestroyService,
  UpdateService,
} from "@/services/children-with-diverse-needs-funding-categories"
import {
  IndexSerializer,
  ShowSerializer,
} from "@/serializers/children-with-diverse-needs-funding-categories"

export class ChildrenWithDiverseNeedsFundingCategoriesController extends BaseController<ChildrenWithDiverseNeedsFundingCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scoped = ChildrenWithDiverseNeedsFundingCategoryPolicy.applyScope(
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
        childrenWithDiverseNeedsFundingCategories: IndexSerializer.perform(
          records,
          this.currentUser
        ),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs categories: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Children with Diverse Needs categories: ${error}` })
    }
  }
  async show() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response
          .status(404)
          .json({ message: "Children with Diverse Needs category not found" })
      const policy = this.buildPolicy(record)
      if (!policy.show())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to view this category" })
      return this.response.json({
        childrenWithDiverseNeedsFundingCategory: ShowSerializer.perform(record),
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs category: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Children with Diverse Needs category: ${error}` })
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
        .json({ childrenWithDiverseNeedsFundingCategory: ShowSerializer.perform(record), policy })
    } catch (error) {
      logger.error(`Error creating Children with Diverse Needs category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error creating Children with Diverse Needs category: ${error}` })
    }
  }
  async update() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response
          .status(404)
          .json({ message: "Children with Diverse Needs category not found" })
      const policy = this.buildPolicy(record)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this category" })
      const updated = await UpdateService.perform(
        record,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({
        childrenWithDiverseNeedsFundingCategory: ShowSerializer.perform(updated),
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Children with Diverse Needs category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error updating Children with Diverse Needs category: ${error}` })
    }
  }
  async destroy() {
    try {
      const record = await this.load()
      if (isNil(record))
        return this.response
          .status(404)
          .json({ message: "Children with Diverse Needs category not found" })
      const policy = this.buildPolicy(record)
      if (!policy.destroy())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to delete this category" })
      await DestroyService.perform(record)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Children with Diverse Needs category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error deleting Children with Diverse Needs category: ${error}` })
    }
  }
  private load() {
    return ChildrenWithDiverseNeedsFundingCategory.findByPk(
      this.params.childrenWithDiverseNeedsFundingCategoryId
    )
  }
  private buildPolicy(
    record: ChildrenWithDiverseNeedsFundingCategory = ChildrenWithDiverseNeedsFundingCategory.build()
  ) {
    return new ChildrenWithDiverseNeedsFundingCategoryPolicy(this.currentUser, record)
  }
}
