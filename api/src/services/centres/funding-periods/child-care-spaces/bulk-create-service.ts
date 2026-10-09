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
    const fiscalPeriodIds: number[] = []
    await FiscalPeriod.findEach(
      {
        attributes: ["id"],
        where: {
          fundingPeriodId: this.fundingPeriod.id,
        },
      },
      async (fiscalPeriod) => {
        fiscalPeriodIds.push(fiscalPeriod.id)
      }
    )
    if (isEmpty(fiscalPeriodIds)) {
      throw new Error("No fiscal periods found for the given funding period.")
    }

    const fiscalYear = FundingSubmissionLine.toLegacyFiscalYearFormat(this.fundingPeriod.fiscalYear)
    const fundingSubmissionLines = await FundingSubmissionLine.findAll({
      attributes: ["id", "lineName", "monthlyAmount"],
      where: {
        fiscalYear,
        sectionName: ChildCareSpace.SECTION_NAME,
      },
    })
    if (isEmpty(fundingSubmissionLines)) return []

    const existingPairKeys = new Set<string>()
    await ChildCareSpace.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findEach(
      {
        attributes: ["fiscalPeriodId", "fundingSubmissionLineId"],
        where: {
          centreId: this.centre.id,
        },
      },
      async (childCareSpace) => {
        const pairKey = `${childCareSpace.fiscalPeriodId}:${childCareSpace.fundingSubmissionLineId}`
        existingPairKeys.add(pairKey)
      }
    )
    const childCareSpacesAttributes: CreationAttributes<ChildCareSpace>[] = []

    for (const fiscalPeriodId of fiscalPeriodIds) {
      for (const fundingSubmissionLine of fundingSubmissionLines) {
        const pairKey = `${fiscalPeriodId}:${fundingSubmissionLine.id}`
        if (existingPairKeys.has(pairKey)) continue

        childCareSpacesAttributes.push({
          centreId: this.centre.id,
          fiscalPeriodId,
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
