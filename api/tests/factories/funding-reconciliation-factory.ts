import FactoryShark from "factory-shark"

import { FundingReconciliation } from "@/models"

import centreFactory from "@/factories/centre-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const fundingReconciliationFactory = FactoryShark.define<FundingReconciliation>(
  FundingReconciliation,
  ({ associate }) => {
    associate("centre", centreFactory)
    associate("fundingPeriod", fundingPeriodFactory)

    return {
      status: FundingReconciliation.Statuses.DRAFT,
      fundingReceivedTotalAmount: "0.0000",
      eligibleExpensesTotalAmount: "0.0000",
      payrollAdjustmentsTotalAmount: "0.0000",
      finalBalanceAmount: "0.0000",
    }
  }
)

export default fundingReconciliationFactory
