import { Op, sql } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory[]> {
    const previousFundingPeriod = await FundingPeriod.findOne({
      attributes: ["id"],
      where: {
        id: {
          [Op.in]: sql`
            (
              SELECT
                funding_period_id
              FROM
                children_with_diverse_needs_funding_categories
            )
          `,
        },
        fiscalYear: { [Op.lt]: this.fundingPeriod.fiscalYear },
      },
      order: [
        ["fiscalYear", "DESC"],
        ["fromDate", "DESC"],
        ["id", "DESC"],
      ],
    })
    const previousCategories = isNil(previousFundingPeriod)
      ? []
      : await ChildrenWithDiverseNeedsFundingCategory.findAll({
          attributes: ["categoryName", "fromAge", "toAge", "monthlyAmount"],
          where: { fundingPeriodId: previousFundingPeriod.id },
          order: [["id", "ASC"]],
        })

    const categories = isNil(previousFundingPeriod)
      ? ChildrenWithDiverseNeedsFundingCategory.DEFAULTS
      : previousCategories.map(({ categoryName, fromAge, toAge, monthlyAmount }) => ({
          categoryName,
          fromAge,
          toAge,
          monthlyAmount,
        }))

    return ChildrenWithDiverseNeedsFundingCategory.bulkCreate(
      categories.map((category) => ({ ...category, fundingPeriodId: this.fundingPeriod.id }))
    )
  }
}

export default BulkCreateService
