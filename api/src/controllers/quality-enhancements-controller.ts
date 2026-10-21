import { isNil } from "lodash"

import logger from "@/utils/logger"
import QualityEnhancement from "@/models/quality-enhancement"
import QualityEnhancementPolicy from "@/policies/quality-enhancement-policy"
import { UpdateService } from "@/services/quality-enhancements"
import { IndexSerializer, ShowSerializer } from "@/serializers/quality-enhancements"
import BaseController from "@/controllers/base-controller"

export class QualityEnhancementsController extends BaseController<QualityEnhancement> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopedEnhancements = QualityEnhancementPolicy.applyScope(
        this.buildFilterScopes(),
        this.currentUser
      )
      const totalCount = await scopedEnhancements.count({ where })
      const enhancements = await scopedEnhancements.findAll({
        where,
        order: this.buildOrder([
          ["fiscalPeriodId", "ASC"],
          ["lineName", "ASC"],
        ]),
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      return this.response.json({
        qualityEnhancements: IndexSerializer.perform(enhancements, this.currentUser),
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Quality Enhancements: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Quality Enhancements: ${error}` })
    }
  }

  async show() {
    try {
      const enhancement = await this.loadEnhancement()
      if (isNil(enhancement))
        return this.response.status(404).json({ message: "Quality Enhancement not found" })
      const policy = new QualityEnhancementPolicy(this.currentUser, enhancement)
      return this.response.json({ qualityEnhancement: ShowSerializer.perform(enhancement), policy })
    } catch (error) {
      logger.error(`Error fetching Quality Enhancement: ${error}`, { error })
      return this.response
        .status(400)
        .json({ message: `Error fetching Quality Enhancement: ${error}` })
    }
  }

  async update() {
    try {
      const enhancement = await this.loadEnhancement()
      if (isNil(enhancement))
        return this.response.status(404).json({ message: "Quality Enhancement not found" })
      const policy = new QualityEnhancementPolicy(this.currentUser, enhancement)
      if (!policy.update())
        return this.response
          .status(403)
          .json({ message: "You are not authorized to update this Quality Enhancement" })
      const updated = await UpdateService.perform(
        enhancement,
        policy.permitAttributes(this.request.body)
      )
      return this.response.json({ qualityEnhancement: ShowSerializer.perform(updated), policy })
    } catch (error) {
      logger.error(`Error updating Quality Enhancement: ${error}`, { error })
      return this.response
        .status(422)
        .json({ message: `Error updating Quality Enhancement: ${error}` })
    }
  }

  private loadEnhancement() {
    return QualityEnhancement.findByPk(this.params.qualityEnhancementId)
  }
}

export default QualityEnhancementsController
