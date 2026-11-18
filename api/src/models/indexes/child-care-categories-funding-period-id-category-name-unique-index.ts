import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildCareCategoriesFundingPeriodIdCategoryNameUniqueIndex = createIndexDecorator(
  "child-care-categories-funding-period-id-category-name-unique",
  {
    unique: true,
    name: "unique_child_care_categories_on_funding_period_id_category_name",
    where: { deletedAt: null },
    msg: "A Child Care category already exists for this funding period and name",
  }
)

export default ChildCareCategoriesFundingPeriodIdCategoryNameUniqueIndex
