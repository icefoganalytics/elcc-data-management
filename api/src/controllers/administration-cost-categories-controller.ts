import { isNil } from "lodash"

import logger from "@/utils/logger"
import { AdministrationCostCategory } from "@/models"
import { AdministrationCostCategoryPolicy } from "@/policies"
import {
  CreateService,
  DestroyService,
  UpdateService,
} from "@/services/administration-cost-categories"
import { IndexSerializer, ShowSerializer } from "@/serializers/administration-cost-categories"
import BaseController from "@/controllers/base-controller"

export class AdministrationCostCategoriesController extends BaseController<AdministrationCostCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopes = this.buildFilterScopes()
      const order = this.buildOrder([["categoryName", "ASC"]])
      const scopedCategories = AdministrationCostCategoryPolicy.applyScope(scopes, this.currentUser)

      const totalCount = await scopedCategories.count({
        where,
      })
      const administrationCostCategories = await scopedCategories.findAll({
        where,
        order,
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      const serializedCategories = IndexSerializer.perform(
        administrationCostCategories,
        this.currentUser
      )

      return this.response.json({
        administrationCostCategories: serializedCategories,
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching administration cost categories: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching administration cost categories: ${error}`,
      })
    }
  }

  async show() {
    try {
      const administrationCostCategory = await this.loadAdministrationCostCategory()
      if (isNil(administrationCostCategory)) {
        return this.response.status(404).json({
          message: "Administration cost category not found",
        })
      }

      const policy = this.buildPolicy(administrationCostCategory)
      if (!policy.show()) {
        return this.response.status(403).json({
          message: "You are not authorized to view this administration cost category",
        })
      }

      const serializedCategory = ShowSerializer.perform(administrationCostCategory)
      return this.response.json({
        administrationCostCategory: serializedCategory,
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching administration cost category: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching administration cost category: ${error}`,
      })
    }
  }

  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create()) {
        return this.response.status(403).json({
          message: "You are not authorized to create administration cost categories",
        })
      }

      const permittedAttributes = policy.permitAttributesForCreate(this.request.body)
      const administrationCostCategory = await CreateService.perform(permittedAttributes)
      const serializedCategory = ShowSerializer.perform(administrationCostCategory)
      return this.response.status(201).json({
        administrationCostCategory: serializedCategory,
        policy,
      })
    } catch (error) {
      logger.error(`Error creating administration cost category: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error creating administration cost category: ${error}`,
      })
    }
  }

  async update() {
    try {
      const administrationCostCategory = await this.loadAdministrationCostCategory()
      if (isNil(administrationCostCategory)) {
        return this.response.status(404).json({
          message: "Administration cost category not found",
        })
      }

      const policy = this.buildPolicy(administrationCostCategory)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to update this administration cost category",
        })
      }

      const permittedAttributes = policy.permitAttributes(this.request.body)
      const updatedCategory = await UpdateService.perform(
        administrationCostCategory,
        permittedAttributes
      )
      const serializedCategory = ShowSerializer.perform(updatedCategory)
      return this.response.json({
        administrationCostCategory: serializedCategory,
        policy,
      })
    } catch (error) {
      logger.error(`Error updating administration cost category: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error updating administration cost category: ${error}`,
      })
    }
  }

  async destroy() {
    try {
      const administrationCostCategory = await this.loadAdministrationCostCategory()
      if (isNil(administrationCostCategory)) {
        return this.response.status(404).json({
          message: "Administration cost category not found",
        })
      }

      const policy = this.buildPolicy(administrationCostCategory)
      if (!policy.destroy()) {
        return this.response.status(403).json({
          message: "You are not authorized to delete this administration cost category",
        })
      }

      await DestroyService.perform(administrationCostCategory)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting administration cost category: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error deleting administration cost category: ${error}`,
      })
    }
  }

  private loadAdministrationCostCategory() {
    return AdministrationCostCategory.findByPk(this.params.administrationCostCategoryId)
  }

  private buildPolicy(
    administrationCostCategory: AdministrationCostCategory = AdministrationCostCategory.build()
  ) {
    return new AdministrationCostCategoryPolicy(this.currentUser, administrationCostCategory)
  }
}

export default AdministrationCostCategoriesController
