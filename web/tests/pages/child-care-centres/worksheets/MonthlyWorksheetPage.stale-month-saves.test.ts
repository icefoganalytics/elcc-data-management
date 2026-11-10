import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import childCareSpacesApi from "@/api/child-care-spaces-api"
import { type FiscalPeriod } from "@/api/fiscal-periods-api"
import fundingSubmissionLineJsonsApi, {
  type FundingSubmissionLineJsonAsIndex,
} from "@/api/funding-submission-line-jsons-api"
import httpClient from "@/api/http-client"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("stale-month saves", () => {
      test("when an older month request finishes last, saves only the selected month's Spaces occupancy", async () => {
        // Arrange
        const updateChildCareSpace = vi.spyOn(childCareSpacesApi, "update")
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
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 5,
          categoryId: 20,
          childCareSpaceCategoryId: 9,
          lineName: "Quality Enhancement Infant Cohort",
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

          if (url === "/api/children-with-diverse-needs-funding-records") {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          }

          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          if (url === "/api/administration-costs") {
            return {
              data: {
                administrationCosts: [administrationCost],
                totalCount: 1,
              },
            }
          }
          throw new Error(`Unexpected GET ${url}`)
        })
        httpClientMock.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/50") {
            return { data: { childCareSpace } }
          }
          if (url === "/api/administration-costs/60") {
            return {
              data: {
                administrationCost,
              },
            }
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
        expect(updateChildCareSpace).toHaveBeenCalledExactlyOnceWith(50, {
          estimatedChildOccupancyRate: "0.5",
          actualChildOccupancyRate: "0.0000",
        })
      })

      test("when an older month request finishes last, saves only the selected month's worksheet JSON", async () => {
        // Arrange
        const updateWorksheet = vi.spyOn(fundingSubmissionLineJsonsApi, "update")
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
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 5,
          categoryId: 20,
          childCareSpaceCategoryId: 9,
          lineName: "Quality Enhancement Infant Cohort",
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

          if (url === "/api/children-with-diverse-needs-funding-records") {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          }

          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          if (url === "/api/administration-costs") {
            return {
              data: {
                administrationCosts: [administrationCost],
                totalCount: 1,
              },
            }
          }
          throw new Error(`Unexpected GET ${url}`)
        })
        httpClientMock.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/50") {
            return { data: { childCareSpace } }
          }
          if (url === "/api/administration-costs/60") {
            return {
              data: {
                administrationCost,
              },
            }
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
        expect(updateWorksheet).toHaveBeenCalledExactlyOnceWith(55, { lines: [] })
      })
    })
  })
})
