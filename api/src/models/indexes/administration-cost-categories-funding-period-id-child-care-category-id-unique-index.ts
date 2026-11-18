import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const AdministrationCostCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex =
  createIndexDecorator(
    "administration-cost-categories-funding-period-id-child-care-category-id-unique",
    {
      unique: true,
      name: "unique_administration_cost_categories_on_funding_period_id_category_name",
      where: {
        deletedAt: null,
      },
      msg: "This Child Care category is already configured for this program and funding period",
    }
  )

export default AdministrationCostCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
