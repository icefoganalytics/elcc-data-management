import { isNil } from "lodash"

import logger from "@/utils/logger"
import { ChildCareSpaceCategory } from "@/models"
import { ChildCareSpaceCategoryPolicy } from "@/policies"
import {
  CreateService,
  DestroyService,
  UpdateService,
} from "@/services/child-care-space-categories"
import { IndexSerializer, ShowSerializer } from "@/serializers/child-care-space-categories"
import BaseController from "@/controllers/base-controller"

export class ChildCareSpaceCategoriesController extends BaseController<ChildCareSpaceCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopes = this.buildFilterScopes()
      const scoped = ChildCareSpaceCategoryPolicy.applyScope(scopes, this.currentUser)
      const totalCount = await scoped.count({ where })
      const records = await scoped.findAll({
        where,
        order: this.buildOrder([["categoryName", "ASC"]]),
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      return this.response.json({
        childCareSpaceCategories: IndexSerializer.perform(records, this.currentUser),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Child Care Space categories: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Child Care Space categories: ${error}` })
    }
  }

  async show() {
    try {
      const category = await this.loadCategory()
      if (isNil(category))
        return this.response.status(404).json({ message: "Child Care Space category not found" })
      const policy = this.buildPolicy(category)
      if (!policy.show())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to view this Child Care Space category" })
      return this.response.json({
        childCareSpaceCategory: ShowSerializer.perform(category),
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Child Care Space category: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Child Care Space category: ${error}` })
    }
  }

  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to create Child Care Space categories" })
      const attributes = policy.permitAttributesForCreate(this.request.body)
      const category = await CreateService.perform(attributes)
      return this.response
        .status(201)
        .json({ childCareSpaceCategory: ShowSerializer.perform(category), policy })
    } catch (error) {
      logger.error(`Error creating Child Care Space category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error creating Child Care Space category: ${error}` })
    }
  }

  async update() {
    try {
      const category = await this.loadCategory()
      if (isNil(category))
        return this.response.status(404).json({ message: "Child Care Space category not found" })
      const policy = this.buildPolicy(category)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this Child Care Space category" })
      const updated = await UpdateService.perform(
        category,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({ childCareSpaceCategory: ShowSerializer.perform(updated), policy })
    } catch (error) {
      logger.error(`Error updating Child Care Space category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error updating Child Care Space category: ${error}` })
    }
  }

  async destroy() {
    try {
      const category = await this.loadCategory()
      if (isNil(category))
        return this.response.status(404).json({ message: "Child Care Space category not found" })
      const policy = this.buildPolicy(category)
      if (!policy.destroy())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to delete this Child Care Space category" })
      await DestroyService.perform(category)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Child Care Space category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error deleting Child Care Space category: ${error}` })
    }
  }

  private loadCategory() {
    return ChildCareSpaceCategory.findByPk(this.params.childCareSpaceCategoryId)
  }

  private buildPolicy(category: ChildCareSpaceCategory = ChildCareSpaceCategory.build()) {
    return new ChildCareSpaceCategoryPolicy(this.currentUser, category)
  }
}

export default ChildCareSpaceCategoriesController
