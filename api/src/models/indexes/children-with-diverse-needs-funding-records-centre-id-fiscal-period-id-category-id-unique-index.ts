import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildrenWithDiverseNeedsFundingRecordCentreIdFiscalPeriodIdCategoryIdUniqueIndex =
  createIndexDecorator(
    "children-with-diverse-needs-funding-records-centre-id-fiscal-period-id-category-id-unique",
    {
      unique: true,
      name: "unique_children_with_diverse_needs_funding_records_on_centre_id_fiscal_period_id_category_id",
      msg: "A Children with Diverse Needs already exists for this category, centre, and fiscal period",
      where: {
        deletedAt: null,
      },
    }
  )

export default ChildrenWithDiverseNeedsFundingRecordCentreIdFiscalPeriodIdCategoryIdUniqueIndex
