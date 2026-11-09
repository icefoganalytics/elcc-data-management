import { type CreationAttributes } from "@sequelize/core"
import { isEmpty } from "lodash"

import {
  Centre,
  ChildrenWithDiverseNeedsFundingCategory,
  ChildrenWithDiverseNeedsFundingRecord,
  FiscalPeriod,
  FundingPeriod,
} from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingRecord[]> {
    const periods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
    if (isEmpty(periods)) {
      throw new Error("No fiscal periods found for the given funding period.")
    }

    const categories = await ChildrenWithDiverseNeedsFundingCategory.findAll({
      attributes: ["id", "categoryName", "monthlyAmount"],
      where: { fundingPeriodId: this.fundingPeriod.id },
      order: [["id", "ASC"]],
    })
    if (isEmpty(categories)) return []

    const existingRecords = await ChildrenWithDiverseNeedsFundingRecord.findAll({
      attributes: ["fiscalPeriodId", "categoryId"],
      where: { centreId: this.centre.id, fiscalPeriodId: periods.map(({ id }) => id) },
      paranoid: false,
    })
    const existingKeys = new Set(
      existingRecords.map(({ fiscalPeriodId, categoryId }) => `${fiscalPeriodId}:${categoryId}`)
    )
    const attributes: CreationAttributes<ChildrenWithDiverseNeedsFundingRecord>[] = []
    for (const period of periods) {
      for (const category of categories) {
        const key = `${period.id}:${category.id}`
        if (existingKeys.has(key)) continue

        attributes.push({
          centreId: this.centre.id,
          fiscalPeriodId: period.id,
          categoryId: category.id,
          lineName: category.categoryName,
          monthlyAmount: category.monthlyAmount,
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
          estimatedComputedTotal: "0.0000",
          actualComputedTotal: "0.0000",
        })
      }
    }

    return ChildrenWithDiverseNeedsFundingRecord.bulkCreate(attributes)
  }
}

export default BulkCreateService
