import { createIndexDecorator } from "@sequelize/core/decorators-legacy"

export const ChildCareSpacesCentreIdFiscalPeriodIdFundingSubmissionLineIdUniqueIndex =
  createIndexDecorator(
    "child-care-spaces-centre-id-fiscal-period-id-funding-submission-line-id-unique",
    {
      unique: true,
      name: "unique_child_care_spaces_on_centre_id_fiscal_period_id_funding_submission_line_id",
      where: {
        deletedAt: null,
      },
      msg: "A Child Care Space already exists for this funding submission line, centre, and fiscal period",
    }
  )

export default ChildCareSpacesCentreIdFiscalPeriodIdFundingSubmissionLineIdUniqueIndex
