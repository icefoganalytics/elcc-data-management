import Big from "big.js"
import { type CreationAttributes } from "@sequelize/core"
import { isEmpty } from "lodash"

import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"
import FundingPeriod from "@/models/funding-period"
import FundingRegion from "@/models/funding-region"
import QualityEnhancement from "@/models/quality-enhancement"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod,
    private isInitialProvisioning = false
  ) {
    super()
  }

  async perform(): Promise<QualityEnhancement[]> {
    const periods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
    if (isEmpty(periods)) throw new Error("No fiscal periods found for the given funding period.")
    const categories = await QualityEnhancementCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
    if (isEmpty(categories)) return []

    const existing = await QualityEnhancement.findAll({
      attributes: ["fiscalPeriodId", "categoryId"],
      where: { centreId: this.centre.id, fiscalPeriodId: periods.map(({ id }) => id) },
      paranoid: false,
    })
    const existingKeys = new Set(
      existing.map(({ fiscalPeriodId, categoryId }) => `${fiscalPeriodId}:${categoryId}`)
    )
    const attributes: CreationAttributes<QualityEnhancement>[] = []
    const initialHotMeal = this.isInitialProvisioning && this.centre.hotMeal
    const hotMealIncrement = initialHotMeal ? await this.getHotMealIncrement() : "0.0000"
    const hotMealAppliedAt = initialHotMeal ? new Date() : null
    for (const period of periods) {
      for (const category of categories) {
        const key = `${period.id}:${category.id}`
        if (existingKeys.has(key)) continue

        attributes.push({
          centreId: this.centre.id,
          fiscalPeriodId: period.id,
          categoryId: category.id,
          childCareSpaceCategoryId: category.childCareSpaceCategoryId,
          lineName: category.categoryName,
          baseMonthlyAmount: category.monthlyAmount,
          hotMealIncrementAmount: hotMealIncrement,
          hotMealAppliedAt,
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
          monthlyAmount: new Big(category.monthlyAmount).plus(hotMealIncrement).toFixed(4),
          estimatedComputedTotal: "0.0000",
          actualComputedTotal: "0.0000",
        })
      }
    }
    return QualityEnhancement.bulkCreate(attributes)
  }

  private async getHotMealIncrement(): Promise<string> {
    const fundingRegion = await FundingRegion.findByPk(this.centre.fundingRegionId)
    if (!fundingRegion) throw new Error(`Funding region for centre ${this.centre.id} not found`)
    return fundingRegion.hotMealIncrementAmount
  }
}
export default BulkCreateService
