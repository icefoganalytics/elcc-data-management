import { isNil } from "lodash"

import logger from "@/utils/logger"
import { ChildCareCategory } from "@/models"
import { ChildCareCategoryPolicy } from "@/policies"
import { CreateService, DestroyService, UpdateService } from "@/services/child-care-categories"
import { IndexSerializer, ShowSerializer } from "@/serializers/child-care-categories"
import BaseController from "@/controllers/base-controller"

export class ChildCareCategoriesController extends BaseController<ChildCareCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopes = this.buildFilterScopes()
      const order = this.buildOrder([["id", "ASC"]])
      const scopedChildCareCategories = ChildCareCategoryPolicy.applyScope(scopes, this.currentUser)

      const totalCount = await scopedChildCareCategories.count({ where })
      const childCareCategories = await scopedChildCareCategories.findAll({
        where,
        order,
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      const serializedChildCareCategories = IndexSerializer.perform(
        childCareCategories,
        this.currentUser
      )
      return this.response.json({
        childCareCategories: serializedChildCareCategories,
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Child Care categories: ${error}`, { error })
      return this.response.status(400).json({
        message: `Error fetching Child Care categories: ${error}`,
      })
    }
  }

  async show() {
    try {
      const childCareCategory = await this.loadChildCareCategory()
      if (isNil(childCareCategory)) {
        return this.response.status(404).json({
          message: "Child Care category not found",
        })
      }

      const policy = this.buildPolicy(childCareCategory)
      if (!policy.show()) {
        return this.response.status(403).json({
          message: "You are not authorized to view this Child Care category",
        })
      }

      const serializedChildCareCategory = ShowSerializer.perform(childCareCategory)
      return this.response.json({
        childCareCategory: serializedChildCareCategory,
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Child Care category: ${error}`, { error })
      return this.response.status(400).json({
        message: `Error fetching Child Care category: ${error}`,
      })
    }
  }

  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create()) {
        return this.response.status(403).json({
          message: "You are not authorized to create Child Care categories",
        })
      }

      const permittedAttributes = policy.permitAttributesForCreate(this.request.body)
      const childCareCategory = await CreateService.perform(permittedAttributes)
      const serializedChildCareCategory = ShowSerializer.perform(childCareCategory)
      return this.response.status(201).json({
        childCareCategory: serializedChildCareCategory,
        policy,
      })
    } catch (error) {
      logger.error(`Error creating Child Care category: ${error}`, { error })
      return this.response.status(422).json({
        message: `Error creating Child Care category: ${error}`,
      })
    }
  }

  async update() {
    try {
      const childCareCategory = await this.loadChildCareCategory()
      if (isNil(childCareCategory)) {
        return this.response.status(404).json({
          message: "Child Care category not found",
        })
      }

      const policy = this.buildPolicy(childCareCategory)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to update this Child Care category",
        })
      }

      const permittedAttributes = policy.permitAttributes(this.request.body)
      const updatedChildCareCategory = await UpdateService.perform(
        childCareCategory,
        permittedAttributes
      )
      const serializedChildCareCategory = ShowSerializer.perform(updatedChildCareCategory)
      return this.response.json({
        childCareCategory: serializedChildCareCategory,
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Child Care category: ${error}`, { error })
      return this.response.status(422).json({
        message: `Error updating Child Care category: ${error}`,
      })
    }
  }

  async destroy() {
    try {
      const childCareCategory = await this.loadChildCareCategory()
      if (isNil(childCareCategory)) {
        return this.response.status(404).json({
          message: "Child Care category not found",
        })
      }

      const policy = this.buildPolicy(childCareCategory)
      if (!policy.destroy()) {
        return this.response.status(403).json({
          message: "You are not authorized to delete this Child Care category",
        })
      }

      await DestroyService.perform(childCareCategory)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Child Care category: ${error}`, { error })
      return this.response.status(422).json({
        message: `Error deleting Child Care category: ${error}`,
      })
    }
  }

  private loadChildCareCategory() {
    return ChildCareCategory.findByPk(this.params.childCareCategoryId)
  }

  private buildPolicy(childCareCategory: ChildCareCategory = ChildCareCategory.build()) {
    return new ChildCareCategoryPolicy(this.currentUser, childCareCategory)
  }
}

export default ChildCareCategoriesController
