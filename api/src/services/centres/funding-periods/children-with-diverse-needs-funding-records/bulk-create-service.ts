import { isNil } from "lodash"

import db from "@/db/db-client"
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

  async perform(): Promise<void> {
    await db.transaction(async () => {
      let hasFiscalPeriods = false
      await FiscalPeriod.findEach(
        {
          attributes: ["id"],
          where: { fundingPeriodId: this.fundingPeriod.id },
          order: [["id", "ASC"]],
        },
        async (fiscalPeriod) => {
          hasFiscalPeriods = true
          await ChildrenWithDiverseNeedsFundingCategory.findEach(
            {
              attributes: ["id", "categoryName", "monthlyAmount"],
              where: { fundingPeriodId: this.fundingPeriod.id },
              order: [["id", "ASC"]],
            },
            async (category) => {
              const existingRecord = await ChildrenWithDiverseNeedsFundingRecord.findOne({
                attributes: ["id"],
                where: {
                  centreId: this.centre.id,
                  fiscalPeriodId: fiscalPeriod.id,
                  categoryId: category.id,
                },
                paranoid: false,
              })
              if (!isNil(existingRecord)) {
                return
              }

              await ChildrenWithDiverseNeedsFundingRecord.create({
                centreId: this.centre.id,
                fiscalPeriodId: fiscalPeriod.id,
                categoryId: category.id,
                lineName: category.categoryName,
                monthlyAmount: category.monthlyAmount,
                estimatedChildOccupancyRate: "0.0000",
                actualChildOccupancyRate: "0.0000",
                estimatedComputedTotal: "0.0000",
                actualComputedTotal: "0.0000",
              })
            }
          )
        }
      )
      if (!hasFiscalPeriods) {
        throw new Error("No fiscal periods found for the given funding period.")
      }
    })
  }
}

export default BulkCreateService
