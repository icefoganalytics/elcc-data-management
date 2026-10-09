import { CreationAttributes, Op } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildCareSpaceCategory, FundingPeriod, FundingSubmissionLine } from "@/models"
import BaseService from "@/services/base-service"

export type FundingSubmissionLineCreationAttributes = Partial<
  CreationAttributes<FundingSubmissionLine>
>

export class CreateService extends BaseService {
  constructor(private attributes: FundingSubmissionLineCreationAttributes) {
    super()
  }

  async perform(): Promise<FundingSubmissionLine> {
    const { fiscalYear, sectionName, lineName, monthlyAmount, ...optionalAttributes } =
      this.attributes

    if (isNil(fiscalYear)) throw new Error("Fiscal year is required")

    if (isNil(sectionName)) throw new Error("Section name is required")

    if (isNil(lineName)) throw new Error("Line name is required")

    if (isNil(monthlyAmount)) throw new Error("Monthly amount is required")

    const childCareSpaceCategoryId = await this.findCategoryId(fiscalYear, sectionName, lineName)

    return FundingSubmissionLine.create({
      ...optionalAttributes,
      fiscalYear,
      sectionName,
      lineName,
      monthlyAmount,
      childCareSpaceCategoryId,
    })
  }

  private async findCategoryId(fiscalYear: string, sectionName: string, lineName: string) {
    if (!this.isChildCareSpaceSection(sectionName)) return null

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
        categoryName: lineName,
      },
    })
    const exactMatches = categories.filter((category) => category.categoryName === lineName)
    if (exactMatches.length > 1) {
      throw new Error(`Multiple child care space categories match "${lineName}" in ${fiscalYear}.`)
    }

    return exactMatches[0]?.id ?? null
  }

  private isChildCareSpaceSection(sectionName: string) {
    return (
      sectionName === "Administration (10% of Spaces)" ||
      sectionName === FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM
    )
  }
}

export default CreateService
