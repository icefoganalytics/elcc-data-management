import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const QualityEnhancementCategoriesFundingPeriodIdCategoryNameUniqueIndex =
  createIndexDecorator("quality-enhancement-categories-funding-period-id-category-name-unique", {
    unique: true,
    name: "unique_quality_enhancement_categories_on_funding_period_id_and_category_name",
    where: { deletedAt: null },
    msg: "A Quality Enhancement category already exists for this funding period and name",
  })

export default QualityEnhancementCategoriesFundingPeriodIdCategoryNameUniqueIndex
