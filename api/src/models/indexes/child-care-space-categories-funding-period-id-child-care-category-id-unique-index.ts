import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildCareSpaceCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex =
  createIndexDecorator(
    "child-care-space-categories-funding-period-id-child-care-category-id-unique",
    {
      unique: true,
      name: "unique_child_care_space_categories_on_funding_period_id_child_care_category_id",
      where: { deletedAt: null },
      msg: "This Child Care category is already configured for this program and funding period",
    }
  )

export default ChildCareSpaceCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
