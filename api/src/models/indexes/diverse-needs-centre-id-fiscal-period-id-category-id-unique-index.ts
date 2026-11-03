import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const DiverseNeedsCentreIdFiscalPeriodIdCategoryIdUniqueIndex = createIndexDecorator(
  "diverse-needs-centre-id-fiscal-period-id-category-id-unique",
  {
    unique: true,
    name: "unique_diverse_needs_on_centre_id_fiscal_period_id_category_id",
    where: { deletedAt: null },
    msg: "A Diverse Need already exists for this category, centre, and fiscal period",
  }
)

export default DiverseNeedsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
