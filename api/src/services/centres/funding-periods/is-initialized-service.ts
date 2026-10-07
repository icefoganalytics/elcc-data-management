import { isEmpty } from "lodash"

import {
  BuildingExpense,
  Centre,
  ChildCareSpace,
  EmployeeBenefit,
  FiscalPeriod,
  FundingPeriod,
  FundingReconciliation,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
} from "@/models"
import BaseService from "@/services/base-service"

export type InitializationStatus = {
  hasEmployeeBenefits: boolean
  hasBuildingExpenses: boolean
  hasChildCareSpaces: boolean
  hasFundingSubmissionLineJsons: boolean
  hasFundingReconciliation: boolean
  isInitialized: boolean
}

export class IsInitializedService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<InitializationStatus> {
    const { id: centreId } = this.centre
    const { id: fundingPeriodId } = this.fundingPeriod
    const hasEmployeeBenefits = await this.checkEmployeeBenefits(centreId, fundingPeriodId)
    const hasBuildingExpenses = await this.checkBuildingExpenses(centreId, fundingPeriodId)
    const hasChildCareSpaces = await this.checkChildCareSpaces(centreId, fundingPeriodId)
    const hasFundingSubmissionLineJsons = await this.checkFundingSubmissionLineJsons(
      centreId,
      fundingPeriodId
    )
    const hasFundingReconciliation = await this.checkFundingReconciliation(
      centreId,
      fundingPeriodId
    )

    const isInitialized =
      hasEmployeeBenefits &&
      hasBuildingExpenses &&
      hasChildCareSpaces &&
      hasFundingSubmissionLineJsons &&
      hasFundingReconciliation

    return {
      hasEmployeeBenefits,
      hasBuildingExpenses,
      hasChildCareSpaces,
      hasFundingSubmissionLineJsons,
      hasFundingReconciliation,
      isInitialized,
    }
  }

  private async checkEmployeeBenefits(centreId: number, fundingPeriodId: number): Promise<boolean> {
    const count = await EmployeeBenefit.withScope({
      method: ["byFundingPeriod", fundingPeriodId],
    }).count({
      where: {
        centreId,
      },
    })
    return count > 0
  }

  private async checkBuildingExpenses(centreId: number, fundingPeriodId: number): Promise<boolean> {
    const count = await BuildingExpense.withScope({
      method: ["byFundingPeriod", fundingPeriodId],
    }).count({
      where: {
        centreId,
      },
    })
    return count > 0
  }

  private async checkChildCareSpaces(centreId: number, fundingPeriodId: number): Promise<boolean> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      where: {
        fundingPeriodId,
      },
    })
    const fiscalYear = FundingSubmissionLine.toLegacyFiscalYearFormat(this.fundingPeriod.fiscalYear)
    const fundingSubmissionLines = await FundingSubmissionLine.findAll({
      where: {
        fiscalYear,
        sectionName: ChildCareSpace.SECTION_NAME,
      },
    })
    if (isEmpty(fiscalPeriods) || isEmpty(fundingSubmissionLines)) return false

    const childCareSpaces = await ChildCareSpace.withScope({
      method: ["byFundingPeriod", fundingPeriodId],
    }).findAll({
      where: {
        centreId,
      },
    })
    const childCareSpacePairKeys = new Set(
      childCareSpaces.map(({ fiscalPeriodId, fundingSubmissionLineId }) => {
        return `${fiscalPeriodId}:${fundingSubmissionLineId}`
      })
    )
    const expectedPairKeys = new Set<string>()
    for (const fiscalPeriod of fiscalPeriods) {
      for (const fundingSubmissionLine of fundingSubmissionLines) {
        expectedPairKeys.add(`${fiscalPeriod.id}:${fundingSubmissionLine.id}`)
      }
    }

    if (childCareSpacePairKeys.size !== expectedPairKeys.size) return false

    for (const expectedPairKey of expectedPairKeys) {
      if (!childCareSpacePairKeys.has(expectedPairKey)) return false
    }

    return true
  }

  private async checkFundingSubmissionLineJsons(
    centreId: number,
    fundingPeriodId: number
  ): Promise<boolean> {
    const count = await FundingSubmissionLineJson.withScope({
      method: ["byFundingPeriod", fundingPeriodId],
    }).count({
      where: {
        centreId,
      },
    })
    return count > 0
  }

  private async checkFundingReconciliation(
    centreId: number,
    fundingPeriodId: number
  ): Promise<boolean> {
    const count = await FundingReconciliation.count({
      where: {
        centreId,
        fundingPeriodId,
      },
    })
    return count > 0
  }
}

export default IsInitializedService
