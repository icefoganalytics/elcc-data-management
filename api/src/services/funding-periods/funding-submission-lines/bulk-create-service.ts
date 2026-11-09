import { Op, sql } from "@sequelize/core"
import { isEmpty } from "lodash"

import { FundingPeriod, FundingSubmissionLine } from "@/models"
import { doesNotUseLedgerSection } from "@/models/validators"

import BaseService from "@/services/base-service"

type FundingSubmissionLineDefaultWithCategory = Pick<
  FundingSubmissionLine,
  "sectionName" | "lineName" | "fromAge" | "toAge" | "monthlyAmount" | "childCareSpaceCategoryId"
>

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<FundingSubmissionLine[]> {
    const { fiscalYear: fundingPeriodFiscalYear } = this.fundingPeriod

    const currentFiscalYearLegacy =
      FundingSubmissionLine.toLegacyFiscalYearFormat(fundingPeriodFiscalYear)

    const fundingSubmissionLineDefaults = await this.buildFundingSubmissionLineDefaults()

    const fundingSubmissionLinesAttributes = fundingSubmissionLineDefaults.map((line) => ({
      ...line,
      childCareSpaceCategoryId: null,
      fiscalYear: currentFiscalYearLegacy,
    }))
    for (const { sectionName } of fundingSubmissionLinesAttributes) {
      doesNotUseLedgerSection(sectionName)
    }

    return FundingSubmissionLine.bulkCreate(fundingSubmissionLinesAttributes)
  }

  private async buildFundingSubmissionLineDefaults(): Promise<
    FundingSubmissionLineDefaultWithCategory[]
  > {
    const newestFiscalYearWithFundingSubmissionLines = sql`
      (
        SELECT
          TOP 1 funding_submission_lines.fiscal_year
        FROM
          funding_submission_lines
        WHERE
          funding_submission_lines.deleted_at IS NULL
        ORDER BY
          funding_submission_lines.fiscal_year DESC,
          funding_submission_lines.id DESC
      )
    `
    const newestFundingSubmissionLines = await FundingSubmissionLine.findAll({
      where: {
        fiscalYear: {
          [Op.in]: newestFiscalYearWithFundingSubmissionLines,
        },
      },
      attributes: [
        "sectionName",
        "lineName",
        "fromAge",
        "toAge",
        "monthlyAmount",
        "childCareSpaceCategoryId",
      ],
    })
    if (isEmpty(newestFundingSubmissionLines)) {
      return FundingSubmissionLine.DEFAULTS.map((line) => ({
        ...line,
        childCareSpaceCategoryId: null,
      }))
    }

    return newestFundingSubmissionLines.map(
      ({ sectionName, lineName, fromAge, toAge, monthlyAmount, childCareSpaceCategoryId }) => ({
        sectionName,
        lineName,
        fromAge,
        toAge,
        monthlyAmount,
        childCareSpaceCategoryId,
      })
    )
  }
}

export default BulkCreateService
