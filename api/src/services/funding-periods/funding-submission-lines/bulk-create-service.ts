import { Op, sql } from "@sequelize/core"
import { isEmpty, isNil } from "lodash"

import { ChildCareSpaceCategory, FundingPeriod, FundingSubmissionLine } from "@/models"

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
    const categoryIdsByName = await this.categoryIdsByName()
    const sourceCategoryNames = await this.sourceCategoryNames(fundingSubmissionLineDefaults)

    const fundingSubmissionLinesAttributes = fundingSubmissionLineDefaults.map(
      (fundingSubmissionLineDefault) => {
        const categoryName = this.isCategoryLinkableSection(
          fundingSubmissionLineDefault.sectionName
        )
          ? this.categoryNameForDefault(fundingSubmissionLineDefault, sourceCategoryNames)
          : undefined
        const childCareSpaceCategoryId =
          categoryName === undefined ? null : (categoryIdsByName.get(categoryName) ?? null)

        return {
          ...fundingSubmissionLineDefault,
          childCareSpaceCategoryId,
          fiscalYear: currentFiscalYearLegacy,
        }
      }
    )

    return FundingSubmissionLine.bulkCreate(fundingSubmissionLinesAttributes)
  }

  private categoryNameForDefault(
    line: FundingSubmissionLineDefaultWithCategory,
    sourceCategoryNames: Map<number, string>
  ) {
    if (line.childCareSpaceCategoryId === null) return line.lineName
    return sourceCategoryNames.get(line.childCareSpaceCategoryId)
  }

  private isCategoryLinkableSection(sectionName: string) {
    return (
      sectionName === "Administration (10% of Spaces)" ||
      sectionName === FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
    )
  }

  private async categoryIdsByName() {
    const categories = await ChildCareSpaceCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      attributes: ["id", "categoryName"],
    })
    return new Map(categories.map(({ id, categoryName }) => [categoryName, id]))
  }

  private async sourceCategoryNames(lines: FundingSubmissionLineDefaultWithCategory[]) {
    const categoryIds = lines
      .map(({ childCareSpaceCategoryId }) => childCareSpaceCategoryId)
      .filter((categoryId): categoryId is number => !isNil(categoryId))
    if (categoryIds.length === 0) return new Map<number, string>()

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
