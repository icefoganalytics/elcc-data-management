import { Op, sql } from "@sequelize/core"
import { isEmpty, isNil, isUndefined } from "lodash"

import { ChildCareSpaceCategory, FundingSubmissionLine, type FundingPeriod } from "@/models"
import doesNotUseChildCareSpacesSection from "@/models/validators/does-not-use-child-care-spaces-section"
import doesNotUseAdministrationSection from "@/models/validators/does-not-use-administration-section"

import BaseService from "@/services/base-service"

type FundingSubmissionLineDefaultWithCategory = {
  sectionName: string
  lineName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  childCareSpaceCategoryId: number | null
}

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<FundingSubmissionLine[]> {
    const { fiscalYear: fundingPeriodFiscalYear } = this.fundingPeriod

    const currentFiscalYearLegacy =
      FundingSubmissionLine.toLegacyFiscalYearFormat(fundingPeriodFiscalYear)

    const fundingSubmissionLineDefaults = await this.buildFundingSubmissionLineDefaults()
    const categoryIdsByName = await this.categoryIdsByName(this.fundingPeriod.id)
    const sourceCategoryNames = await this.sourceCategoryNames(fundingSubmissionLineDefaults)

    const fundingSubmissionLinesAttributes = fundingSubmissionLineDefaults.map(
      (fundingSubmissionLineDefault) => {
        const categoryName =
          fundingSubmissionLineDefault.sectionName ===
          FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
            ? this.categoryNameForDefault(fundingSubmissionLineDefault, sourceCategoryNames)
            : undefined
        const childCareSpaceCategoryId = isUndefined(categoryName)
          ? null
          : (categoryIdsByName.get(categoryName) ?? null)

        return {
          ...fundingSubmissionLineDefault,
          childCareSpaceCategoryId,
          fiscalYear: currentFiscalYearLegacy,
        }
      }
    )
    for (const { sectionName } of fundingSubmissionLinesAttributes) {
      doesNotUseChildCareSpacesSection(sectionName)
      doesNotUseAdministrationSection(sectionName)
    }

    return FundingSubmissionLine.bulkCreate(fundingSubmissionLinesAttributes)
  }

  private categoryNameForDefault(
    line: FundingSubmissionLineDefaultWithCategory,
    sourceCategoryNames: Map<number, string>
  ) {
    if (line.childCareSpaceCategoryId === null) {
      return line.lineName
    }

    return sourceCategoryNames.get(line.childCareSpaceCategoryId)
  }

  private async categoryIdsByName(fundingPeriodId: number) {
    const categories = await ChildCareSpaceCategory.findAll({
      where: { fundingPeriodId },
      attributes: ["id", "categoryName"],
    })
    return new Map(categories.map(({ id, categoryName }) => [categoryName, id]))
  }

  private async sourceCategoryNames(lines: FundingSubmissionLineDefaultWithCategory[]) {
    const categoryIdsIncludingNull = lines.map(
      ({ childCareSpaceCategoryId }) => childCareSpaceCategoryId
    )
    const categoryIds = categoryIdsIncludingNull.filter(
      (categoryId): categoryId is number => !isNil(categoryId)
    )
    if (categoryIds.length === 0) {
      return new Map<number, string>()
    }

    const categories = await ChildCareSpaceCategory.findAll({
      where: { id: { [Op.in]: categoryIds } },
      attributes: ["id", "categoryName"],
      paranoid: false,
    })
    return new Map(categories.map(({ id, categoryName }) => [id, categoryName]))
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
