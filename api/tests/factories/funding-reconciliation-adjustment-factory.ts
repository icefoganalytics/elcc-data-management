import FactoryShark from "factory-shark"

import { FundingReconciliationAdjustment } from "@/models"

import fundingReconciliationFactory from "@/factories/funding-reconciliation-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const fundingReconciliationAdjustmentFactory =
  FactoryShark.define<FundingReconciliationAdjustment>(
    FundingReconciliationAdjustment,
    ({ associate }) => {
      associate("fundingReconciliation", fundingReconciliationFactory)
      associate("fiscalPeriod", fiscalPeriodFactory)

      return {
        fundingReceivedPeriodAmount: "0.0000",
        eligibleExpensesPeriodAmount: "0.0000",
        payrollAdjustmentsPeriodAmount: "0.0000",
        cumulativeBalanceAmount: "0.0000",
      }
    }
  )

export default fundingReconciliationAdjustmentFactory
