import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { type FiscalPeriod } from "@/api/fiscal-periods-api"
import { type FundingSubmissionLineJsonAsIndex } from "@/api/funding-submission-line-jsons-api"
import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
} from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("worksheet navigation", () => {
      test("when an older month request finishes last, saves only the selected month's worksheet", async () => {
        // Arrange
        const aprilWorksheetList = Promise.withResolvers<{
          data: {
            fundingSubmissionLineJsons: FundingSubmissionLineJsonAsIndex[]
            totalCount: number
          }
        }>()
        const aprilFiscalPeriodList = Promise.withResolvers<{
          data: { fiscalPeriods: FiscalPeriod[]; totalCount: number }
        }>()
        const mayWorksheetList = Promise.withResolvers<{
          data: {
            fundingSubmissionLineJsons: FundingSubmissionLineJsonAsIndex[]
            totalCount: number
          }
        }>()
        const mayFiscalPeriodList = Promise.withResolvers<{
          data: { fiscalPeriods: FiscalPeriod[]; totalCount: number }
        }>()
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 55,
          centreId: 1,
          dateName: "May",
          dateStart: "2024-05-01",
          dateEnd: "2024-05-31",
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 50,
          centreId: 1,
          fiscalPeriodId: 5,
          categoryId: 9,
          lineName: "May Infant Cohort",
        })
        const administrationCost = administrationCostFactory.build({
          id: 60,
          centreId: 1,
          fiscalPeriodId: 5,
          categoryId: 15,
          lineName: "Administration Infant Cohort",
        })
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockImplementation(async (url, config) => {
          if (url === "/api/funding-submission-line-jsons") {
            if (config?.params?.where?.dateName === "April") {
              return await aprilWorksheetList.promise
            }

            return await mayWorksheetList.promise
          }

          if (url === "/api/fiscal-periods") {
            if (config?.params?.where?.month === "april") {
              return await aprilFiscalPeriodList.promise
            }

            return await mayFiscalPeriodList.promise
          }

          if (url === "/api/funding-submission-line-jsons/55") {
            return { data: { fundingSubmissionLineJson } }
          }

          if (url === "/api/child-care-spaces" && config?.params?.where?.fiscalPeriodId === 5) {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }

          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [administrationCost], totalCount: 1 } }
          }
          throw new Error(`Unexpected GET ${url}`)
        })
        const savedWorksheetUpdates: string[] = []
        httpClientMock.patch.mockImplementation(async (url) => {
          savedWorksheetUpdates.push(url)
          if (url === "/api/child-care-spaces/50") {
            return { data: { childCareSpace } }
          }
          if (url === "/api/administration-costs/60") {
            return { data: { administrationCost } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: {
            centreId: 1,
            fiscalYearSlug: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            stubs: {
              BuildingExpenseCreateFormCard: true,
              BuildingExpensesEditTable: true,
            },
          },
        })

        // Act
        await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
        mayWorksheetList.resolve({
          data: {
            fundingSubmissionLineJsons: [fundingSubmissionLineJson],
            totalCount: 1,
          },
        })
        mayFiscalPeriodList.resolve({
          data: {
            fiscalPeriods: [
              fiscalPeriodFactory.build({
                id: 5,
                fundingPeriodId: 1,
                month: FiscalPeriodMonths.MAY,
                dateStart: "2024-05-01",
                dateEnd: "2024-05-31",
              }),
            ],
            totalCount: 1,
          },
        })
        await flushPromises()
        aprilWorksheetList.resolve({
          data: {
            fundingSubmissionLineJsons: [
              { ...fundingSubmissionLineJson, id: 44, dateName: "April" },
            ],
            totalCount: 1,
          },
        })
        aprilFiscalPeriodList.resolve({
          data: {
            fiscalPeriods: [
              fiscalPeriodFactory.build({
                id: 4,
                fundingPeriodId: 1,
                month: FiscalPeriodMonths.APRIL,
              }),
            ],
            totalCount: 1,
          },
        })
        await flushPromises()
        const estimateInput = wrapper.get("tbody input")
        await estimateInput.setValue("0.5")
        await estimateInput.trigger("change")
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(savedWorksheetUpdates).toEqual([
          "/api/child-care-spaces/50",
          "/api/administration-costs/60",
          "/api/funding-submission-line-jsons/55",
        ])
      })

      test("when the fiscal period is pending after replication, withholds worksheet editing", async () => {
        // Arrange
        const mayFiscalPeriodList = Promise.withResolvers<{
          data: { fiscalPeriods: FiscalPeriod[]; totalCount: number }
        }>()
        const aprilWorksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
        })
        const mayWorksheet = fundingSubmissionLineJsonFactory.build({
          id: 55,
          centreId: 1,
          dateName: "May",
          dateStart: "2024-05-01",
          dateEnd: "2024-05-31",
        })
        const aprilFiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          month: FiscalPeriodMonths.APRIL,
        })
        const administrationCost = administrationCostFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 15,
          childCareSpaceCategoryId: 9,
          lineName: "Administration Infant Cohort",
          monthlyAmount: "10.0000",
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 40,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 9,
          lineName: "April Infant Cohort",
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
          if (url === "/api/fiscal-periods" && config?.params?.where?.month === "may") {
            return mayFiscalPeriodList.promise
          }

          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [aprilFiscalPeriod], totalCount: 1 } }
          }

          if (url === "/api/funding-submission-line-jsons") {
            const worksheet =
              config?.params?.where?.dateName === "May" ? mayWorksheet : aprilWorksheet
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }

          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [administrationCost], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson: aprilWorksheet } }
        })
        vi.mocked(httpClient, true).patch.mockResolvedValue({ data: {} })
        vi.mocked(httpClient, true).post.mockResolvedValue({ data: {} })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: {
            centreId: 1,
            fiscalYearSlug: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()

        const replicateEstimatesButton = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicateEstimatesButton) {
          throw new Error("Expected the Replicate Estimates button")
        }
        // Act
        await replicateEstimatesButton.trigger("click")
        await flushPromises()

        await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input")).toHaveLength(0)
      })

      test("when Administration costs fail to load, withholds worksheet editing", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return {
              data: {
                fiscalPeriods: [
                  {
                    id: 4,
                    fiscalYear: "2024-25",
                    month: FiscalPeriodMonths.APRIL,
                  },
                ],
                totalCount: 1,
              },
            }
          }
          if (url === "/api/funding-submission-line-jsons/44") {
            return { data: { fundingSubmissionLineJson: worksheet } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [], totalCount: 0 } }
          }
          if (url === "/api/administration-costs") {
            throw new Error("Administration costs unavailable")
          }
          throw new Error(`Unexpected GET ${url}`)
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: {
            centreId: 1,
            fiscalYearSlug: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input")).toHaveLength(0)
      })
    })
  })
})
