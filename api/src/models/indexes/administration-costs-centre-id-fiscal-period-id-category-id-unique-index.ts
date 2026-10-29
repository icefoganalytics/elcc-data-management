import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const AdministrationCostsCentreIdFiscalPeriodIdCategoryIdUniqueIndex = createIndexDecorator(
  "administration-costs-centre-id-fiscal-period-id-category-id-unique",
  {
    unique: true,
    name: "unique_administration_costs_on_centre_id_fiscal_period_id_category_id",
    where: {
      deletedAt: null,
    },
    msg: "An administration cost already exists for this category, centre, and fiscal period",
  }
)

export default AdministrationCostsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
