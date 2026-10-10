import { CreationAttributes, Op } from "@sequelize/core"
import { merge, omit } from "lodash"

import { ChildCareSpaceCategory, FundingPeriod, FundingSubmissionLine } from "@/models"

const LINKED_SECTIONS = [
  "Administration (10% of Spaces)",
  FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
]

export class FundingSubmissionLineServices {
  static async bulkCreateFrom(
    attributes: Partial<CreationAttributes<FundingSubmissionLine>>,
    fiscalYearsToFilterOn: string[]
  ) {
    const linesToCreateFrom = await FundingSubmissionLine.findAll({
      where: { fiscalYear: { [Op.in]: fiscalYearsToFilterOn } },
    })
    const newLinesCreationAttributes = linesToCreateFrom.map((line) => {
      const originalAttributes = line.get()
      const creationAttributes = omit(originalAttributes, ["id"])
      return merge(creationAttributes, attributes)
    })

    const targetFiscalYear = attributes.fiscalYear
    if (targetFiscalYear === undefined) {
      return FundingSubmissionLine.bulkCreate(newLinesCreationAttributes)
    }

    const startingYear = Number(targetFiscalYear.slice(0, 4))
    const fundingPeriods = await FundingPeriod.findAll({
      where: { fiscalYear: `${startingYear}-${startingYear + 1}` },
    })
    const targetCategories =
      fundingPeriods.length === 0
        ? []
        : await ChildCareSpaceCategory.findAll({
            where: { fundingPeriodId: { [Op.in]: fundingPeriods.map(({ id }) => id) } },
            attributes: ["id", "categoryName"],
          })
    const categoryIdsByName = new Map<string, number[]>()
    for (const { id, categoryName } of targetCategories) {
      const categoryIds = categoryIdsByName.get(categoryName) ?? []
      categoryIds.push(id)
      categoryIdsByName.set(categoryName, categoryIds)
    }
    const sourceCategoryIds: number[] = []
    for (const { childCareSpaceCategoryId } of linesToCreateFrom) {
      if (childCareSpaceCategoryId === null) continue

      sourceCategoryIds.push(childCareSpaceCategoryId)
    }
    const sourceCategories =
      sourceCategoryIds.length === 0
        ? []
        : await ChildCareSpaceCategory.findAll({
            where: { id: { [Op.in]: sourceCategoryIds } },
            attributes: ["id", "categoryName"],
            paranoid: false,
          })
    const sourceCategoryNamesById = new Map(
      sourceCategories.map(({ id, categoryName }) => [id, categoryName])
    )

    const linesWithRemappedCategoryIds = newLinesCreationAttributes.map((attributes, index) => {
      const sourceLine = linesToCreateFrom[index]
      const sectionName = attributes.sectionName ?? sourceLine.sectionName
      const categoryName =
        sourceLine.childCareSpaceCategoryId === null
          ? (attributes.lineName ?? sourceLine.lineName)
          : sourceCategoryNamesById.get(sourceLine.childCareSpaceCategoryId)
      if (!LINKED_SECTIONS.includes(sectionName) || categoryName === undefined) {
        return { ...attributes, childCareSpaceCategoryId: null }
      }

      const categoryIds = categoryIdsByName.get(categoryName) ?? []
      if (categoryIds.length > 1) {
        throw new Error(
          `Multiple child care space categories named "${categoryName}" match ${targetFiscalYear}.`
        )
      }

      const childCareSpaceCategoryId = categoryIds[0] ?? null
      return { ...attributes, childCareSpaceCategoryId }
    })

    return FundingSubmissionLine.bulkCreate(linesWithRemappedCategoryIds)
  }
}

export default FundingSubmissionLineServices
