import { Op, type CreationAttributes } from "@sequelize/core"
import Big from "big.js"
import { isNil } from "lodash"

import db from "@/db/db-client"
import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"
import FundingRegion from "@/models/funding-region"
import QualityEnhancement from "@/models/quality-enhancement"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"

export type QualityEnhancementCreationAttributes = Partial<
  Pick<
    CreationAttributes<QualityEnhancement>,
    | "centreId"
    | "fiscalPeriodId"
    | "categoryId"
    | "estimatedChildOccupancyRate"
    | "actualChildOccupancyRate"
  >
> & { applyToCurrentAndFutureFiscalPeriods?: boolean }

export class CreateService extends BaseService {
  constructor(private attributes: QualityEnhancementCreationAttributes) {
    super()
  }

  async perform(): Promise<QualityEnhancement> {
    const {
      centreId,
      fiscalPeriodId,
      categoryId,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      applyToCurrentAndFutureFiscalPeriods,
    } = this.attributes
    if (isNil(centreId)) throw new Error("Centre ID is required")
    if (isNil(fiscalPeriodId)) throw new Error("Fiscal period ID is required")
    if (isNil(categoryId)) throw new Error("Quality Enhancement category ID is required")
    if (isNil(estimatedChildOccupancyRate)) throw new Error("Estimated occupancy rate is required")
    if (isNil(actualChildOccupancyRate)) throw new Error("Actual occupancy rate is required")

    return db.transaction(async () => {
      const centre = await Centre.findByPk(centreId, { rejectOnEmpty: true })
      const fiscalPeriod = await FiscalPeriod.findByPk(fiscalPeriodId, { rejectOnEmpty: true })
      const category = await QualityEnhancementCategory.findOne({
        where: { id: categoryId, fundingPeriodId: fiscalPeriod.fundingPeriodId },
      })
      if (isNil(category)) {
        throw new Error(
          "Quality Enhancement category does not belong to the fiscal period funding period"
        )
      }

      const existing = await QualityEnhancement.findOne({
        attributes: ["id"],
        where: { centreId, fiscalPeriodId, categoryId },
      })
      if (!isNil(existing)) {
        throw new Error(
          "Quality Enhancement already exists for this centre, fiscal period, and category"
        )
      }

      let hotMealIncrementAmount = "0.0000"
      let hotMealAppliedAt: Date | null = null
      if (centre.hotMeal) {
        const region = await FundingRegion.findByPk(centre.fundingRegionId, { rejectOnEmpty: true })
        hotMealIncrementAmount = region.hotMealIncrementAmount
        hotMealAppliedAt = new Date()
      }
      const monthlyAmount = new Big(category.monthlyAmount).plus(hotMealIncrementAmount).toFixed(4)
      const attributes = {
        centreId,
        categoryId,
        childCareSpaceCategoryId: category.childCareSpaceCategoryId,
        lineName: category.categoryName,
        baseMonthlyAmount: category.monthlyAmount,
        hotMealIncrementAmount,
        hotMealAppliedAt,
        monthlyAmount,
        estimatedChildOccupancyRate,
        actualChildOccupancyRate,
        estimatedComputedTotal: "0.0000",
        actualComputedTotal: "0.0000",
      }
      const enhancement = await QualityEnhancement.create({ ...attributes, fiscalPeriodId })
      if (!applyToCurrentAndFutureFiscalPeriods) return enhancement

      await FiscalPeriod.findEach(
        {
          attributes: ["id"],
          where: {
            fundingPeriodId: fiscalPeriod.fundingPeriodId,
            dateStart: { [Op.gt]: fiscalPeriod.dateStart },
          },
          order: [["dateStart", "ASC"]],
        },
        async (futureFiscalPeriod) => {
          const existingEnhancement = await QualityEnhancement.findOne({
            attributes: ["id"],
            where: { centreId, categoryId, fiscalPeriodId: futureFiscalPeriod.id },
          })
          if (!isNil(existingEnhancement)) return

          await QualityEnhancement.create({
            ...attributes,
            fiscalPeriodId: futureFiscalPeriod.id,
          })
        }
      )

      return enhancement
    })
  }
}

export default CreateService
