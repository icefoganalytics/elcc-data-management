import { isNil } from "lodash"

import logger from "@/utils/logger"
import { AdministrationCost } from "@/models"
import { AdministrationCostPolicy } from "@/policies"
import { UpdateService } from "@/services/administration-costs"
import { IndexSerializer, ShowSerializer } from "@/serializers/administration-costs"
import BaseController from "@/controllers/base-controller"

export class AdministrationCostsController extends BaseController<AdministrationCost> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopes = this.buildFilterScopes()
      const order = this.buildOrder([
        ["lineName", "ASC"],
        ["id", "ASC"],
      ])
      const scopedAdministrationCosts = AdministrationCostPolicy.applyScope(
        scopes,
        this.currentUser
      )

      const totalCount = await scopedAdministrationCosts.count({
        where,
      })
      const administrationCosts = await scopedAdministrationCosts.findAll({
        where,
        order,
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      const serializedAdministrationCosts = IndexSerializer.perform(
        administrationCosts,
        this.currentUser
      )

      return this.response.json({
        administrationCosts: serializedAdministrationCosts,
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching administration costs: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching administration costs: ${error}`,
      })
    }
  }

  async show() {
    try {
      const administrationCost = await this.loadAdministrationCost()
      if (isNil(administrationCost)) {
        return this.response.status(404).json({
          message: "Administration cost not found",
        })
      }

      const policy = this.buildPolicy(administrationCost)
      if (!policy.show()) {
        return this.response.status(403).json({
          message: "You are not authorized to view this administration cost",
        })
      }

      const serializedAdministrationCost = ShowSerializer.perform(administrationCost)
      return this.response.json({
        administrationCost: serializedAdministrationCost,
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching administration cost: ${error}`, {
        error,
      })
      return this.response.status(400).json({
        message: `Error fetching administration cost: ${error}`,
      })
    }
  }

  async update() {
    try {
      const administrationCost = await this.loadAdministrationCost()
      if (isNil(administrationCost)) {
        return this.response.status(404).json({
          message: "Administration cost not found",
        })
      }

      const policy = this.buildPolicy(administrationCost)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to update this administration cost",
        })
      }

      const permittedAttributes = policy.permitAttributes(this.request.body)
      const updatedAdministrationCost = await UpdateService.perform(
        administrationCost,
        permittedAttributes
      )
      const serializedAdministrationCost = ShowSerializer.perform(updatedAdministrationCost)
      return this.response.json({
        administrationCost: serializedAdministrationCost,
        policy,
      })
    } catch (error) {
      logger.error(`Error updating administration cost: ${error}`, {
        error,
      })
      return this.response.status(422).json({
        message: `Error updating administration cost: ${error}`,
      })
    }
  }

  private loadAdministrationCost() {
    return AdministrationCost.findByPk(this.params.administrationCostId)
  }

  private buildPolicy(administrationCost: AdministrationCost = AdministrationCost.build()) {
    return new AdministrationCostPolicy(this.currentUser, administrationCost)
  }
}

export default AdministrationCostsController
