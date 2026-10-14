import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildCareSpacesCentreIdFiscalPeriodIdCategoryIdUniqueIndex = createIndexDecorator(
  "child-care-spaces-centre-id-fiscal-period-id-category-id-unique",
  {
    unique: true,
    name: "unique_child_care_spaces_on_centre_id_fiscal_period_id_category_id",
    where: { deletedAt: null },
    msg: "A Child Care Space already exists for this category, centre, and fiscal period",
  }
)

export default ChildCareSpacesCentreIdFiscalPeriodIdCategoryIdUniqueIndex
