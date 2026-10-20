import { CreationAttributes, Op } from "@sequelize/core"
import { isUndefined, merge, omit } from "lodash"

import { ChildCareSpaceCategory, FundingPeriod, FundingSubmissionLine } from "@/models"
import doesNotUseChildCareSpacesSection from "@/models/validators/does-not-use-child-care-spaces-section"
import doesNotUseAdministrationSection from "@/models/validators/does-not-use-administration-section"

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
      const lineAttributes = merge(creationAttributes, attributes)
      doesNotUseChildCareSpacesSection(lineAttributes.sectionName ?? line.sectionName)
      doesNotUseAdministrationSection(lineAttributes.sectionName ?? line.sectionName)
      return lineAttributes
    })

    const targetFiscalYear = attributes.fiscalYear
    if (isUndefined(targetFiscalYear)) {
      return FundingSubmissionLine.bulkCreate(newLinesCreationAttributes)
    }

    const startingYear = Number(targetFiscalYear.slice(0, 4))
    const fundingPeriods = await FundingPeriod.findAll({
      where: { fiscalYear: `${startingYear}-${startingYear + 1}` },
    })
    let targetCategories: ChildCareSpaceCategory[]
    if (fundingPeriods.length === 0) {
      targetCategories = []
    } else {
      targetCategories = await ChildCareSpaceCategory.findAll({
        where: { fundingPeriodId: { [Op.in]: fundingPeriods.map(({ id }) => id) } },
        attributes: ["id", "categoryName"],
      })
    }

    const categoryIdsByName = new Map<string, number[]>()
    for (const { id, categoryName } of targetCategories) {
      const categoryIds = categoryIdsByName.get(categoryName) ?? []
      categoryIds.push(id)
      categoryIdsByName.set(categoryName, categoryIds)
    }
    const sourceCategoryIds: number[] = []
    for (const { childCareSpaceCategoryId } of linesToCreateFrom) {
      if (childCareSpaceCategoryId === null) {
        continue
      }

      sourceCategoryIds.push(childCareSpaceCategoryId)
    }
    let sourceCategories: ChildCareSpaceCategory[]
    if (sourceCategoryIds.length === 0) {
      sourceCategories = []
    } else {
      sourceCategories = await ChildCareSpaceCategory.findAll({
        where: { id: { [Op.in]: sourceCategoryIds } },
        attributes: ["id", "categoryName"],
        paranoid: false,
      })
    }

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
      if (
        sectionName !== FundingSubmissionLine.ImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM ||
        isUndefined(categoryName)
      ) {
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
