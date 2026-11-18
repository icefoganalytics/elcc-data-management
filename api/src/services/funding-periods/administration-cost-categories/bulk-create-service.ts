import { Op, sql, type CreationAttributes } from "@sequelize/core"

import { AdministrationCostCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkEnsureSharedCategoriesService from "@/services/funding-periods/child-care-categories/bulk-ensure-service"
import EnsureClonedCategoryService from "@/services/funding-periods/child-care-categories/ensure-cloned-category-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<AdministrationCostCategory[]> {
    const sharedCategories = await BulkEnsureSharedCategoriesService.perform(this.fundingPeriod)
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
                administration_cost_categories
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
    const attributes: CreationAttributes<AdministrationCostCategory>[] = []
    if (!previousFundingPeriod) {
      const sharedCategoriesByName = new Map(
        sharedCategories.map((category) => [category.categoryName, category])
      )
      for (const { categoryName, monthlyAmount } of AdministrationCostCategory.DEFAULTS) {
        const sharedCategory = sharedCategoriesByName.get(categoryName)
        if (!sharedCategory) continue

        attributes.push({
          fundingPeriodId: this.fundingPeriod.id,
          childCareCategoryId: sharedCategory.id,
          monthlyAmount,
        })
      }
    } else {
      const previousCategories = await AdministrationCostCategory.findAll({
        where: { fundingPeriodId: previousFundingPeriod.id },
        include: [{ association: "childCareCategory", paranoid: false }],
        order: [["id", "ASC"]],
      })
      for (const category of previousCategories) {
        const sourceCategory = category.childCareCategory
        if (!sourceCategory)
          throw new Error(`Child Care category missing for program category ${category.id}`)

        const targetCategory = await EnsureClonedCategoryService.perform(
          sourceCategory,
          this.fundingPeriod
        )
        if (!targetCategory) continue

        attributes.push({
          fundingPeriodId: this.fundingPeriod.id,
          childCareCategoryId: targetCategory.id,
          monthlyAmount: category.monthlyAmount,
        })
      }
    }

    const categories = await AdministrationCostCategory.bulkCreate(attributes, { validate: true })
    if (categories.length === 0) return []

    return AdministrationCostCategory.findAll({
      where: { id: categories.map(({ id }) => id) },
      order: [["id", "ASC"]],
    })
  }
}

export default BulkCreateService
