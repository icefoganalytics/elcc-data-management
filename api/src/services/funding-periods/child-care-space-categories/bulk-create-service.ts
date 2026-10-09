import { Op, sql } from "@sequelize/core"
import { isEmpty } from "lodash"

import { ChildCareSpaceCategory, FundingPeriod } from "@/models"

import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory[]> {
    const categories = await this.buildCategories()
    return ChildCareSpaceCategory.bulkCreate(
      categories.map((category) => ({ ...category, fundingPeriodId: this.fundingPeriod.id }))
    )
  }

  private async buildCategories() {
    const newestFundingPeriodId = sql`
      (
        SELECT
          TOP 1 child_care_space_categories.funding_period_id
        FROM
          child_care_space_categories
          INNER JOIN funding_periods ON funding_periods.id = child_care_space_categories.funding_period_id
        WHERE
          child_care_space_categories.deleted_at IS NULL
          AND funding_periods.deleted_at IS NULL
        ORDER BY
          funding_periods.fiscal_year DESC,
          funding_periods.from_date DESC,
          funding_periods.id DESC
      )
    `
    const categories = await ChildCareSpaceCategory.findAll({
      where: { fundingPeriodId: { [Op.in]: newestFundingPeriodId } },
      attributes: ["categoryName", "fromAge", "toAge", "monthlyAmount"],
      order: [["id", "ASC"]],
    })
    if (!isEmpty(categories)) {
      return categories.map(({ categoryName, fromAge, toAge, monthlyAmount }) => ({
        categoryName,
        fromAge,
        toAge,
        monthlyAmount,
      }))
    }
    return ChildCareSpaceCategory.DEFAULTS
  }
}

export default BulkCreateService
