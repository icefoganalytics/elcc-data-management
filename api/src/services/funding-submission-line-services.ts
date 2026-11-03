import { Op, type CreationAttributes } from "@sequelize/core"
import { merge, omit } from "lodash"

import { FundingSubmissionLine } from "@/models"
import { doesNotUseLedgerSection } from "@/models/validators"

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
      doesNotUseLedgerSection(lineAttributes.sectionName ?? line.sectionName)
      return lineAttributes
    })

    return FundingSubmissionLine.bulkCreate(
      newLinesCreationAttributes.map((attributes) => ({
        ...attributes,
        childCareSpaceCategoryId: null,
      }))
    )
  }
}

export default FundingSubmissionLineServices
