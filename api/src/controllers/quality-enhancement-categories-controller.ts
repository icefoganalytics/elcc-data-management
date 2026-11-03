import { isNil } from "lodash"

import logger from "@/utils/logger"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import QualityEnhancementCategoryPolicy from "@/policies/quality-enhancement-category-policy"
import {
  CreateService,
  DestroyService,
  UpdateService,
} from "@/services/quality-enhancement-categories"
import { IndexSerializer, ShowSerializer } from "@/serializers/quality-enhancement-categories"
import BaseController from "@/controllers/base-controller"

export class QualityEnhancementCategoriesController extends BaseController<QualityEnhancementCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopedCategories = QualityEnhancementCategoryPolicy.applyScope(
        this.buildFilterScopes(),
        this.currentUser
      )
      const totalCount = await scopedCategories.count({ where })
      const categories = await scopedCategories.findAll({
        where,
        order: this.buildOrder([["categoryName", "ASC"]]),
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      return this.response.json({
        qualityEnhancementCategories: IndexSerializer.perform(categories, this.currentUser),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Quality Enhancement categories: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Quality Enhancement categories: ${error}` })
    }
  }

  async show() {
    try {
      const category = await this.loadCategory()
      if (isNil(category))
        return this.response.status(404).json({ message: "Quality Enhancement category not found" })
      const policy = new QualityEnhancementCategoryPolicy(this.currentUser, category)
      return this.response.json({
        qualityEnhancementCategory: ShowSerializer.perform(category),
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Quality Enhancement category: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Quality Enhancement category: ${error}` })
    }
  }

  async create() {
    try {
      const policy = new QualityEnhancementCategoryPolicy(
        this.currentUser,
        QualityEnhancementCategory.build()
      )
      if (!policy.create())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to create Quality Enhancement categories" })
      const category = await CreateService.perform(
        policy.permitAttributesForCreate(this.request.body)
      )
      return this.response
        .status(201)
        .json({ qualityEnhancementCategory: ShowSerializer.perform(category), policy })
    } catch (error) {
      logger.error(`Error creating Quality Enhancement category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error creating Quality Enhancement category: ${error}` })
    }
  }

  async update() {
    try {
      const category = await this.loadCategory()
      if (isNil(category))
        return this.response.status(404).json({ message: "Quality Enhancement category not found" })
      const policy = new QualityEnhancementCategoryPolicy(this.currentUser, category)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this Quality Enhancement category" })
      const updatedCategory = await UpdateService.perform(
        category,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({
        qualityEnhancementCategory: ShowSerializer.perform(updatedCategory),
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Quality Enhancement category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error updating Quality Enhancement category: ${error}` })
    }
  }

  async destroy() {
    try {
      const category = await this.loadCategory()
      if (isNil(category))
        return this.response.status(404).json({ message: "Quality Enhancement category not found" })
      const policy = new QualityEnhancementCategoryPolicy(this.currentUser, category)
      if (!policy.destroy())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to delete this Quality Enhancement category" })
      await DestroyService.perform(category)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Quality Enhancement category: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error deleting Quality Enhancement category: ${error}` })
    }
  }

  private loadCategory() {
    return QualityEnhancementCategory.findByPk(this.params.qualityEnhancementCategoryId)
  }
}

export default QualityEnhancementCategoriesController
