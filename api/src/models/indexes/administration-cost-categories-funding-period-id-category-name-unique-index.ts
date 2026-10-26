import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const AdministrationCostCategoriesFundingPeriodIdCategoryNameUniqueIndex =
  createIndexDecorator("administration-cost-categories-funding-period-id-category-name-unique", {
    unique: true,
    name: "unique_administration_cost_categories_on_funding_period_id_category_name",
    where: {
      deletedAt: null,
    },
    msg: "An administration cost category already exists for this funding period",
  })

export default AdministrationCostCategoriesFundingPeriodIdCategoryNameUniqueIndex
