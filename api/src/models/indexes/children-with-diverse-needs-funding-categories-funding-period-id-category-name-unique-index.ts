import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildrenWithDiverseNeedsFundingCategoriesFundingPeriodIdCategoryNameUniqueIndex =
  createIndexDecorator(
    "children-with-diverse-needs-funding-categories-funding-period-id-category-name-unique",
    {
      unique: true,
      name: "unique_children_with_diverse_needs_funding_categories_on_funding_period_id_and_category_name",
      msg: "A Diverse Need category already exists for this funding period and name",
      where: {
        deletedAt: null,
      },
    }
  )

export default ChildrenWithDiverseNeedsFundingCategoriesFundingPeriodIdCategoryNameUniqueIndex
