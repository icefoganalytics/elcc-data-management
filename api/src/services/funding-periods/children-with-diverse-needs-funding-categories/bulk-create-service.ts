import { Op, sql } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory[]> {
    const categories = await this.buildCategories(this.fundingPeriod.fiscalYear)
    const attributes = categories.map((category) => ({
      ...category,
      fundingPeriodId: this.fundingPeriod.id,
    }))

    return ChildrenWithDiverseNeedsFundingCategory.bulkCreate(attributes)
  }

  private async buildCategories(fiscalYear: string) {
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
        fiscalYear: {
          [Op.lt]: fiscalYear,
        },
      },
      order: [
        ["fiscalYear", "DESC"],
        ["fromDate", "DESC"],
        ["id", "DESC"],
      ],
    })
    if (isNil(previousFundingPeriod)) {
      return ChildrenWithDiverseNeedsFundingCategory.DEFAULTS
    }

    const previousCategories = await ChildrenWithDiverseNeedsFundingCategory.findAll({
      attributes: ["categoryName", "fromAge", "toAge", "monthlyAmount"],
      where: {
        fundingPeriodId: previousFundingPeriod.id,
      },
      order: [["id", "ASC"]],
    })

    return previousCategories.map(({ categoryName, fromAge, toAge, monthlyAmount }) => ({
      categoryName,
      fromAge,
      toAge,
      monthlyAmount,
    }))
  }
}

export default BulkCreateService
