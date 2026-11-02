import { type CreationAttributes } from "@sequelize/core"
import { isEmpty } from "lodash"

import {
  Centre,
  FiscalPeriod,
  FundingPeriod,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
} from "@/models"
import { type FundingLineValue } from "@/models/funding-line-value"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<FundingSubmissionLineJson[]> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      where: {
        fundingPeriodId: this.fundingPeriod.id,
      },
    })
    if (isEmpty(fiscalPeriods)) {
      throw new Error("No fiscal periods found for the given funding period")
    }

    const { fiscalYear: fiscalYearLong } = this.fundingPeriod
    const fiscalYearLegacy = FundingSubmissionLine.toLegacyFiscalYearFormat(fiscalYearLong)

    const fundingSubmissionLines = await FundingSubmissionLine.findAll({
      where: {
        fiscalYear: fiscalYearLegacy,
      },
    })
    if (isEmpty(fundingSubmissionLines)) {
      throw new Error("No funding submission lines found for the funding period.")
    }

    const fundingSubmissionLineJsonsDefaults = fundingSubmissionLines.map(
      (fundingSubmissionLine) => {
        const {
          id: submissionLineId,
          sectionName,
          lineName,
          monthlyAmount,
          childCareSpaceCategoryId,
        } = fundingSubmissionLine

        const line: FundingLineValue = {
          submissionLineId,
          sectionName,
          lineName,
          monthlyAmount,
          estimatedChildOccupancyRate: "0",
          actualChildOccupancyRate: "0",
          estimatedComputedTotal: "0",
          actualComputedTotal: "0",
          ...(childCareSpaceCategoryId === null ? {} : { childCareSpaceCategoryId }),
        }

        return line
      }
    )

    const { id: centreId } = this.centre
    const fundingSubmissionLineJsonsAttributes: CreationAttributes<FundingSubmissionLineJson>[] =
      fiscalPeriods.map(({ dateStart, dateEnd }) => {
        const dateName = FundingSubmissionLineJson.asFundingSubmissionLineJsonMonth(dateStart)
        const values = JSON.stringify(fundingSubmissionLineJsonsDefaults)
        return {
          centreId,
          fiscalYear: fiscalYearLegacy,
          dateName,
          dateStart,
          dateEnd,
          values,
        }
      })

    return FundingSubmissionLineJson.bulkCreate(fundingSubmissionLineJsonsAttributes)
  }
}

export default BulkCreateService
