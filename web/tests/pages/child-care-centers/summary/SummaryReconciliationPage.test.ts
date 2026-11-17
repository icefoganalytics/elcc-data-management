import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { type FundingReconciliation } from "@/api/funding-reconciliations-api"
import { type FundingReconciliationAdjustment } from "@/api/funding-reconciliation-adjustments-api"
import { FiscalPeriodMonths } from "@/api/fiscal-periods-api"

import { fiscalPeriodFactory } from "@/tests/factories"
import { mockHttpGetRoutes, mountWithDefaultPlugins } from "@/tests/support"

import SummaryReconciliationPage from "@/pages/child-care-centers/summary/SummaryReconciliationPage.vue"

describe("web/src/pages/child-care-centers/summary/SummaryReconciliationPage.vue", () => {
  describe("SummaryReconciliationPage", () => {
    describe("recorded reconciliation figures", () => {
      test("when monthly records are loaded, displays their figures and recorded totals", async () => {
        // Arrange
        const april = fiscalPeriodFactory.build({
          id: 11,
          fundingPeriodId: 4,
        })
        const may = fiscalPeriodFactory.build({
          id: 12,
          fundingPeriodId: 4,
          month: FiscalPeriodMonths.MAY,
          dateStart: "2024-05-01",
          dateEnd: "2024-05-31",
        })
        const fundingReconciliation: FundingReconciliation = {
          id: 9,
          centreId: 3,
          fundingPeriodId: 4,
          status: "draft",
          fundingReceivedTotalAmount: "1500.2500",
          eligibleExpensesTotalAmount: "1200.1000",
          payrollAdjustmentsTotalAmount: "50.1500",
          finalBalanceAmount: "250.0000",
          notes: null,
          finalizedAt: null,
          finalizedById: null,
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        }
        const adjustments: FundingReconciliationAdjustment[] = [
          {
            id: 21,
            fundingReconciliationId: 9,
            fiscalPeriodId: april.id,
            fundingReceivedPeriodAmount: "0.0000",
            eligibleExpensesPeriodAmount: "0.0000",
            payrollAdjustmentsPeriodAmount: "0.0000",
            cumulativeBalanceAmount: "0.0000",
            createdAt: "2024-06-01T00:00:00.000Z",
            updatedAt: "2024-06-01T00:00:00.000Z",
          },
          {
            id: 22,
            fundingReconciliationId: 9,
            fiscalPeriodId: may.id,
            fundingReceivedPeriodAmount: "1500.2500",
            eligibleExpensesPeriodAmount: "1200.1000",
            payrollAdjustmentsPeriodAmount: "50.1500",
            cumulativeBalanceAmount: "250.0000",
            createdAt: "2024-06-01T00:00:00.000Z",
            updatedAt: "2024-06-01T00:00:00.000Z",
          },
        ]
        mockHttpGetRoutes({
          "/api/funding-reconciliations": () => ({
            data: {
              fundingReconciliations: [fundingReconciliation],
              totalCount: 1,
            },
          }),
          "/api/funding-reconciliation-adjustments": () => ({
            data: {
              fundingReconciliationAdjustments: adjustments,
              totalCount: 2,
            },
          }),
          "/api/fiscal-periods": () => ({
            data: {
              fiscalPeriods: [april, may],
              totalCount: 2,
            },
          }),
        })
        vi.mocked(httpClient.post).mockResolvedValue({
          data: {
            fundingReconciliation,
          },
        })

        // Act
        const wrapper = mountWithDefaultPlugins(SummaryReconciliationPage, {
          props: {
            centreId: "3",
            fiscalYearSlug: "2024-25",
          },
        })
        await flushPromises()

        // Assert
        expect(
          wrapper.findAll("tbody tr").map((row) => row.findAll("td").map((cell) => cell.text()))
        ).toEqual([
          ["April Expenses", "$0.00", "$0.00", "$0.00", "$0.00"],
          ["May Expenses", "$1,500.25", "$1,200.10", "$50.15", "$250.00"],
          ["Totals", "$1,500.25", "$1,200.10", "$50.15", "$250.00"],
        ])
      })
    })
  })
})
