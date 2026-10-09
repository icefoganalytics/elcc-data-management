import { Attributes, Op } from "@sequelize/core"

import { ChildCareSpaceCategory, FundingPeriod, FundingSubmissionLine } from "@/models"
import BaseService from "@/services/base-service"

export type FundingSubmissionLineUpdateAttributes = Partial<Attributes<FundingSubmissionLine>>

export class UpdateService extends BaseService {
  constructor(
    private fundingSubmissionLine: FundingSubmissionLine,
    private attributes: FundingSubmissionLineUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<FundingSubmissionLine> {
    const fiscalYear = this.attributes.fiscalYear ?? this.fundingSubmissionLine.fiscalYear
    const sectionName = this.attributes.sectionName ?? this.fundingSubmissionLine.sectionName
    const lineName = this.attributes.lineName ?? this.fundingSubmissionLine.lineName
    const childCareSpaceCategoryId = await this.categoryIdForUpdatedLine(
      fiscalYear,
      sectionName,
      lineName
    )

    await this.fundingSubmissionLine.update({
      ...this.attributes,
      childCareSpaceCategoryId,
    })
    return this.fundingSubmissionLine
  }

  private async categoryIdForUpdatedLine(
    fiscalYear: string,
    sectionName: string,
    lineName: string
  ) {
    if (!this.isChildCareSpaceSection(sectionName)) return null

    const existingCategoryId = this.fundingSubmissionLine.childCareSpaceCategoryId
    const periodIsUnchanged = fiscalYear === this.fundingSubmissionLine.fiscalYear
    if (existingCategoryId !== null && periodIsUnchanged) return existingCategoryId

    const categoryName =
      existingCategoryId === null ? lineName : await this.existingCategoryName(existingCategoryId)
    if (categoryName === undefined) return null

    const startingYear = Number(fiscalYear.slice(0, 4))
    const fundingPeriods = await FundingPeriod.findAll({
      attributes: ["id"],
      where: { fiscalYear: `${startingYear}-${startingYear + 1}` },
    })
    if (fundingPeriods.length === 0) return null

    const categories = await ChildCareSpaceCategory.findAll({
      attributes: ["id", "categoryName"],
      where: {
        fundingPeriodId: { [Op.in]: fundingPeriods.map(({ id }) => id) },
        categoryName,
      },
    })
    const exactMatches = categories.filter((category) => category.categoryName === categoryName)
    if (exactMatches.length > 1) {
      throw new Error(
        `Multiple child care space categories match "${categoryName}" in ${fiscalYear}.`
      )
    }

    return exactMatches[0]?.id ?? null
  }

  private async existingCategoryName(categoryId: number) {
    const category = await ChildCareSpaceCategory.findByPk(categoryId, { paranoid: false })
    return category?.categoryName
  }
  private isChildCareSpaceSection(sectionName: string) {
    return (
      sectionName === "Administration (10% of Spaces)" ||
      sectionName === FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
    )
  }
}

export default UpdateService
