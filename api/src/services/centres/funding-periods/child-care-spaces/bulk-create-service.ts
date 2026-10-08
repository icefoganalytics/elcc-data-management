import { type CreationAttributes } from "@sequelize/core"
import { isEmpty } from "lodash"

import {
  ChildCareSpace,
  Centre,
  FiscalPeriod,
  FundingPeriod,
  FundingSubmissionLine,
} from "@/models"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpace[]> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      where: {
        fundingPeriodId: this.fundingPeriod.id,
      },
    })
    if (isEmpty(fiscalPeriods)) {
      throw new Error("No fiscal periods found for the given funding period.")
    }

    const fiscalYear = FundingSubmissionLine.toLegacyFiscalYearFormat(this.fundingPeriod.fiscalYear)
    const fundingSubmissionLines = await FundingSubmissionLine.findAll({
      where: {
        fiscalYear,
        sectionName: ChildCareSpace.SECTION_NAME,
      },
    })
    if (isEmpty(fundingSubmissionLines)) return []

    const childCareSpaces = await ChildCareSpace.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findAll({
      where: {
        centreId: this.centre.id,
      },
    })
    const existingPairKeys = new Set(
      childCareSpaces.map(({ fiscalPeriodId, fundingSubmissionLineId }) => {
        return `${fiscalPeriodId}:${fundingSubmissionLineId}`
      })
    )
    const childCareSpacesAttributes: CreationAttributes<ChildCareSpace>[] = []

    for (const fiscalPeriod of fiscalPeriods) {
      for (const fundingSubmissionLine of fundingSubmissionLines) {
        const pairKey = `${fiscalPeriod.id}:${fundingSubmissionLine.id}`
        if (existingPairKeys.has(pairKey)) continue

        childCareSpacesAttributes.push({
          centreId: this.centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: fundingSubmissionLine.id,
          lineName: fundingSubmissionLine.lineName,
          monthlyAmount: fundingSubmissionLine.monthlyAmount,
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
          estimatedComputedTotal: "0.0000",
          actualComputedTotal: "0.0000",
        })
      }
    }

    return ChildCareSpace.bulkCreate(childCareSpacesAttributes)
  }
}

export default BulkCreateService
