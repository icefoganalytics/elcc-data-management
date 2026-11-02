import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const QualityEnhancementsCentreIdFiscalPeriodIdCategoryIdUniqueIndex = createIndexDecorator(
  "quality-enhancements-centre-id-fiscal-period-id-category-id-unique",
  {
    unique: true,
    name: "unique_quality_enhancements_on_centre_id_fiscal_period_id_and_category_id",
    where: { deletedAt: null },
    msg: "A Quality Enhancement already exists for this centre, fiscal period, and category",
  }
)

export default QualityEnhancementsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
