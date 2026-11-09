import { Op, sql } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory[]> {
    const childrenWithDiverseNeedsFundingCategoriesAttributes =
      await this.buildChildrenWithDiverseNeedsFundingCategoriesAttributes(
        this.fundingPeriod.id,
        this.fundingPeriod.fiscalYear
      )

    return ChildrenWithDiverseNeedsFundingCategory.bulkCreate(
      childrenWithDiverseNeedsFundingCategoriesAttributes
    )
  }

  private async buildChildrenWithDiverseNeedsFundingCategoriesAttributes(
    fundingPeriodId: number,
    fiscalYear: string
  ) {
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
      return ChildrenWithDiverseNeedsFundingCategory.DEFAULTS.map((categoryAttributes) => ({
        ...categoryAttributes,
        fundingPeriodId,
      }))
    }

    const previousChildrenWithDiverseNeedsFundingCategories =
      await ChildrenWithDiverseNeedsFundingCategory.findAll({
        attributes: ["categoryName", "fromAge", "toAge", "monthlyAmount"],
        where: {
          fundingPeriodId: previousFundingPeriod.id,
        },
        order: [["id", "ASC"]],
      })

    return previousChildrenWithDiverseNeedsFundingCategories.map(
      ({ categoryName, fromAge, toAge, monthlyAmount }) => ({
        fundingPeriodId,
        categoryName,
        fromAge,
        toAge,
        monthlyAmount,
      })
    )
  }
}

export default BulkCreateService
