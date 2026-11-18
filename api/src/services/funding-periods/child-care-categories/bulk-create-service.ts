import { Op, sql } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildCareCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildCareCategory[]> {
    const previousFundingPeriod = await FundingPeriod.findOne({
      attributes: ["id"],
      where: {
        fiscalYear: { [Op.lt]: this.fundingPeriod.fiscalYear },
        id: {
          [Op.in]: sql`
            (
              SELECT
                funding_period_id
              FROM
                child_care_categories
            )
          `,
        },
      },
      order: [
        ["fiscalYear", "DESC"],
        ["fromDate", "DESC"],
        ["id", "DESC"],
      ],
    })
    const categories = isNil(previousFundingPeriod)
      ? ChildCareCategory.DEFAULTS.map((category) => ({ ...category, deletedAt: null }))
      : await ChildCareCategory.findAll({
          where: { fundingPeriodId: previousFundingPeriod.id },
          order: [["id", "ASC"]],
          paranoid: false,
        })

    const clonedCategories = await ChildCareCategory.bulkCreate(
      categories.map(({ categoryName, fromAge, toAge, deletedAt }) => ({
        fundingPeriodId: this.fundingPeriod.id,
        categoryName,
        fromAge,
        toAge,
        deletedAt,
      }))
    )
    return clonedCategories.filter((category) => category.deletedAt === null)
  }
}

export default BulkCreateService
