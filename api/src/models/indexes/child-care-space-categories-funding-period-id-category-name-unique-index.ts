import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildCareSpaceCategoriesFundingPeriodIdCategoryNameUniqueIndex = createIndexDecorator(
  "child-care-space-categories-funding-period-id-category-name-unique",
  {
    unique: true,
    name: "unique_child_care_space_categories_on_funding_period_id_and_category_name",
    where: { deletedAt: null },
    msg: "A Child Care Space category already exists for this funding period and name",
  }
)

export default ChildCareSpaceCategoriesFundingPeriodIdCategoryNameUniqueIndex
