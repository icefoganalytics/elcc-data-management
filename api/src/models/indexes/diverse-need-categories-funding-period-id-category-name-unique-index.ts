import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const DiverseNeedCategoriesFundingPeriodIdCategoryNameUniqueIndex = createIndexDecorator(
  "diverse-need-categories-funding-period-id-category-name-unique",
  {
    unique: true,
    name: "unique_diverse_need_categories_on_funding_period_id_and_category_name",
    where: { deletedAt: null },
    msg: "A Diverse Need category already exists for this funding period and name",
  }
)

export default DiverseNeedCategoriesFundingPeriodIdCategoryNameUniqueIndex
