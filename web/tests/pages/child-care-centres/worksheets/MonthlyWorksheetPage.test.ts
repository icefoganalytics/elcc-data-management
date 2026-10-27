import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { type FiscalPeriod } from "@/api/fiscal-periods-api"
import { type FundingSubmissionLineJsonAsIndex } from "@/api/funding-submission-line-jsons-api"
import { mockRouter, mockVuetify } from "@/tests/support"
import { childCareSpaceFactory, fundingSubmissionLineJsonFactory } from "@/tests/factories"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

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

          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          }

          throw new Error(`Unexpected GET ${url}`)
        })
        const savedWorksheetUpdates: string[] = []
        httpClientMock.patch.mockImplementation(async (url) => {
          savedWorksheetUpdates.push(url)
          if (url === "/api/child-care-spaces/50") {
            return { data: { childCareSpace } }
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
              {
                id: 5,
                fundingPeriodId: 1,
                fiscalYear: "2024-25",
                month: FiscalPeriodMonths.MAY,
                dateStart: "2024-05-01",
                dateEnd: "2024-05-31",
                createdAt: "2024-01-01",
                updatedAt: "2024-01-01",
              },
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
              {
                id: 4,
                fundingPeriodId: 1,
                fiscalYear: "2024-25",
                month: FiscalPeriodMonths.APRIL,
                dateStart: "2024-04-01",
                dateEnd: "2024-04-30",
                createdAt: "2024-01-01",
                updatedAt: "2024-01-01",
              },
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
          "/api/funding-submission-line-jsons/55",
        ])
      })

      test("when the next month's fiscal period is pending, withholds the worksheet inputs", async () => {
        // Arrange
        const mayFiscalPeriodList = Promise.withResolvers<{
          data: { fiscalPeriods: FiscalPeriod[]; totalCount: number }
        }>()
        const aprilWorksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          dateStart: "2024-04-01",
          dateEnd: "2024-04-30",
          lines: [],
        })
        const mayWorksheet = fundingSubmissionLineJsonFactory.build({
          id: 55,
          centreId: 1,
          dateName: "May",
          dateStart: "2024-05-01",
          dateEnd: "2024-05-31",
          lines: [],
        })
        const aprilFiscalPeriod: FiscalPeriod = {
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
          dateStart: "2024-04-01",
          dateEnd: "2024-04-30",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        }
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

          if (url === "/api/child-care-spaces") {
            return {
              data: {
                childCareSpaces: [childCareSpace],
                totalCount: 1,
              },
            }
          }

          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          }

          return { data: { fundingSubmissionLineJson: aprilWorksheet } }
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
        await flushPromises()

        // Act
        await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input")).toEqual([])
      })
    })
  })
})
