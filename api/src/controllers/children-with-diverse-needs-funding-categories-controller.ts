import { isNil } from "lodash"

import BaseController from "@/controllers/base-controller"
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
import logger from "@/utils/logger"

export class ChildrenWithDiverseNeedsFundingCategoriesController extends BaseController<ChildrenWithDiverseNeedsFundingCategory> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopedFundingCategories = ChildrenWithDiverseNeedsFundingCategoryPolicy.applyScope(
        this.buildFilterScopes(),
        this.currentUser
      )
      const totalCount = await scopedFundingCategories.count({ where })
      const fundingCategories = await scopedFundingCategories.findAll({
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
          fundingCategories,
          this.currentUser
        ),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs funding categories: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching Children with Diverse Needs funding categories: ${error}`,
      })
    }
  }

  async show() {
    try {
      const fundingCategory = await this.loadFundingCategory()
      if (isNil(fundingCategory)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding category not found",
        })
      }

      const policy = this.buildPolicy(fundingCategory)
      if (!policy.show()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to view this Children with Diverse Needs funding category",
        })
      }

      return this.response.json({
        childrenWithDiverseNeedsFundingCategory: ShowSerializer.perform(fundingCategory),
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Children with Diverse Needs funding category: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching Children with Diverse Needs funding category: ${error}`,
      })
    }
  }

  async create() {
    try {
      const policy = this.buildPolicy()
      if (!policy.create()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to create Children with Diverse Needs funding categories",
        })
      }

      const fundingCategory = await CreateService.perform(
        policy.permitAttributesForCreate(this.request.body)
      )
      return this.response.status(201).json({
        childrenWithDiverseNeedsFundingCategory: ShowSerializer.perform(fundingCategory),
        policy,
      })
    } catch (error) {
      logger.error(`Error creating Children with Diverse Needs funding category: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error creating Children with Diverse Needs funding category: ${error}`,
      })
    }
  }

  async update() {
    try {
      const fundingCategory = await this.loadFundingCategory()
      if (isNil(fundingCategory)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding category not found",
        })
      }

      const policy = this.buildPolicy(fundingCategory)
      if (!policy.update()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to update this Children with Diverse Needs funding category",
        })
      }

      const updatedFundingCategory = await UpdateService.perform(
        fundingCategory,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({
        childrenWithDiverseNeedsFundingCategory: ShowSerializer.perform(updatedFundingCategory),
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Children with Diverse Needs funding category: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error updating Children with Diverse Needs funding category: ${error}`,
      })
    }
  }

  async destroy() {
    try {
      const fundingCategory = await this.loadFundingCategory()
      if (isNil(fundingCategory)) {
        return this.response.status(404).json({
          message: "Children with Diverse Needs funding category not found",
        })
      }

      const policy = this.buildPolicy(fundingCategory)
      if (!policy.destroy()) {
        return this.response.status(403).json({
          message:
            "You are not authorized to delete this Children with Diverse Needs funding category",
        })
      }

      await DestroyService.perform(fundingCategory)
      return this.response.status(204).send()
    } catch (error) {
      logger.error(`Error deleting Children with Diverse Needs funding category: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error deleting Children with Diverse Needs funding category: ${error}`,
      })
    }
  }

  private async loadFundingCategory(): Promise<ChildrenWithDiverseNeedsFundingCategory | null> {
    return ChildrenWithDiverseNeedsFundingCategory.findByPk(
      this.params.childrenWithDiverseNeedsFundingCategoryId
    )
  }

  private buildPolicy(
    fundingCategory: ChildrenWithDiverseNeedsFundingCategory = ChildrenWithDiverseNeedsFundingCategory.build()
  ): ChildrenWithDiverseNeedsFundingCategoryPolicy {
    return new ChildrenWithDiverseNeedsFundingCategoryPolicy(this.currentUser, fundingCategory)
  }
}
