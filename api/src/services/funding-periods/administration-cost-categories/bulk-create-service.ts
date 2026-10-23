import { Op, sql, type CreationAttributes } from "@sequelize/core"
import { isEmpty, isNil } from "lodash"

import { AdministrationCostCategory, ChildCareSpaceCategory, type FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory[]> {
    const categories = await this.buildCategories(this.fundingPeriod.id)
    return AdministrationCostCategory.bulkCreate(
      categories.map((category) => ({
        ...category,
        fundingPeriodId: this.fundingPeriod.id,
      }))
    )
  }

  private async buildCategories(
    fundingPeriodId: number
  ): Promise<Omit<CreationAttributes<AdministrationCostCategory>, "fundingPeriodId">[]> {
    const targetChildCareSpaceCategories = await ChildCareSpaceCategory.findAll({
      attributes: ["id", "categoryName"],
      where: { fundingPeriodId },
    })
    const targetChildCareSpaceCategoryIdsByName = new Map(
      targetChildCareSpaceCategories.map(({ id, categoryName }) => [categoryName, id])
    )

    const newestFundingPeriodId = sql`
      (
        SELECT
          TOP 1 administration_cost_categories.funding_period_id
        FROM
          administration_cost_categories
          INNER JOIN funding_periods ON funding_periods.id = administration_cost_categories.funding_period_id
        WHERE
          administration_cost_categories.deleted_at IS NULL
          AND funding_periods.deleted_at IS NULL
        ORDER BY
          funding_periods.fiscal_year DESC,
          funding_periods.from_date DESC,
          funding_periods.id DESC
      )
    `
    const newestCategories = await AdministrationCostCategory.findAll({
      attributes: ["categoryName", "fromAge", "toAge", "monthlyAmount", "childCareSpaceCategoryId"],
      where: { fundingPeriodId: { [Op.in]: newestFundingPeriodId } },
      order: [["id", "ASC"]],
    })

    if (isEmpty(newestCategories)) {
      return AdministrationCostCategory.DEFAULTS.map(
        ({ categoryName, fromAge, toAge, monthlyAmount }) => {
          const childCareSpaceCategoryId =
            targetChildCareSpaceCategoryIdsByName.get(categoryName) ?? null

          return {
            childCareSpaceCategoryId,
            categoryName,
            fromAge,
            toAge,
            monthlyAmount,
          }
        }
      )
    }

    const sourceChildCareSpaceCategoryIds = newestCategories.flatMap(
      ({ childCareSpaceCategoryId }) =>
        isNil(childCareSpaceCategoryId) ? [] : [childCareSpaceCategoryId]
    )
    const sourceChildCareSpaceCategories = isEmpty(sourceChildCareSpaceCategoryIds)
      ? []
      : await ChildCareSpaceCategory.findAll({
          attributes: ["id", "categoryName"],
          where: { id: { [Op.in]: sourceChildCareSpaceCategoryIds } },
        })
    const sourceChildCareSpaceCategoryNamesById = new Map(
      sourceChildCareSpaceCategories.map(({ id, categoryName }) => [id, categoryName])
    )

    return newestCategories.map((category) => {
      const sourceChildCareSpaceCategoryId = category.childCareSpaceCategoryId
      const sourceChildCareSpaceCategoryName = isNil(sourceChildCareSpaceCategoryId)
        ? undefined
        : sourceChildCareSpaceCategoryNamesById.get(sourceChildCareSpaceCategoryId)
      let targetChildCareSpaceCategoryId: number | null = null
      if (!isNil(sourceChildCareSpaceCategoryName)) {
        targetChildCareSpaceCategoryId =
          targetChildCareSpaceCategoryIdsByName.get(sourceChildCareSpaceCategoryName) ?? null
      }

      return {
        childCareSpaceCategoryId: targetChildCareSpaceCategoryId,
        categoryName: category.categoryName,
        fromAge: category.fromAge,
        toAge: category.toAge,
        monthlyAmount: category.monthlyAmount,
      }
    })
  }
}

export default BulkCreateService
