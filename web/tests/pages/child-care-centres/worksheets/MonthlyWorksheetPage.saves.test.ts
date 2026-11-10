import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import fundingSubmissionLineJsonsApi from "@/api/funding-submission-line-jsons-api"
import httpClient from "@/api/http-client"
import qualityEnhancementsApi from "@/api/quality-enhancements-api"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("saving edited cells", () => {
      test.each(["Save", "Replicate Estimates"])(
        "when a Quality Enhancement cell is edited, %s saves it without Enter",
        async (actionLabel) => {
          // Arrange
          const updateQualityEnhancement = vi.spyOn(qualityEnhancementsApi, "update")
          const worksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            dateName: "April",
            lines: [],
          })
          const fiscalPeriod = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          const quality = qualityEnhancementFactory.build({
            id: 70,
            centreId: 1,
            fiscalPeriodId: 4,
            categoryId: 20,
            estimatedChildOccupancyRate: "0.6250",
          })
          const http = vi.mocked(httpClient, true)
          http.get.mockImplementation(async (url) => {
            if (url === "/api/funding-submission-line-jsons") {
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            }
            if (url === "/api/fiscal-periods") {
              return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
            }
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [], totalCount: 0 } }
            }
            if (url === "/api/administration-costs") {
              return { data: { administrationCosts: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-records") {
              return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [quality], totalCount: 1 } }
            }
            return { data: { fundingSubmissionLineJson: worksheet } }
          })
          http.patch.mockResolvedValue({ data: {} })
          http.post.mockResolvedValue({ data: undefined })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const wrapper = mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              plugins: [router, createPinia(), mockVuetify()],
              stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
            },
          })
          await flushPromises()

          // Act
          const qualityRow = wrapper
            .findAll("tr.cursor-pointer")
            .find((row) => row.text().includes(quality.lineName))
          if (!qualityRow) throw new Error("Expected the Quality Enhancement row")
          await qualityRow.trigger("click")
          await flushPromises()
          const estimateInput = wrapper.get<HTMLInputElement>("tbody input")
          await estimateInput.setValue("0.8125")
          const action = wrapper
            .findAll("button")
            .find((button) => button.text().trim() === actionLabel)
          if (!action) throw new Error(`Expected ${actionLabel} button`)
          await action.trigger("click")
          await flushPromises()

          // Assert
          expect(updateQualityEnhancement).toHaveBeenCalledExactlyOnceWith(70, {
            estimatedChildOccupancyRate: "0.8125",
          })
        }
      )

      test("when replicating an edited Quality Enhancement cell, replicates the worksheet JSON estimates", async () => {
        // Arrange
        const actionLabel = "Replicate Estimates"
        const replicateWorksheet = vi.spyOn(fundingSubmissionLineJsonsApi, "replicateEstimates")
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          lines: [],
        })
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        const quality = qualityEnhancementFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 20,
          estimatedChildOccupancyRate: "0.6250",
        })
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [], totalCount: 0 } }
          }
          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [], totalCount: 0 } }
          }
          if (url === "/api/children-with-diverse-needs-funding-records") {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [quality], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockResolvedValue({ data: {} })
        http.post.mockResolvedValue({ data: undefined })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()

        // Act
        const qualityRow = wrapper
          .findAll("tr.cursor-pointer")
          .find((row) => row.text().includes(quality.lineName))
        if (!qualityRow) throw new Error("Expected the Quality Enhancement row")
        await qualityRow.trigger("click")
        await flushPromises()
        const estimateInput = wrapper.get<HTMLInputElement>("tbody input")
        await estimateInput.setValue("0.8125")
        const action = wrapper
          .findAll("button")
          .find((button) => button.text().trim() === actionLabel)
        if (!action) throw new Error(`Expected ${actionLabel} button`)
        await action.trigger("click")
        await flushPromises()

        // Assert
        expect(replicateWorksheet).toHaveBeenCalledExactlyOnceWith(44)
      })

      test("when replicating an edited Quality Enhancement cell, replicates its estimates", async () => {
        // Arrange
        const actionLabel = "Replicate Estimates"
        const replicateQualityEnhancement = vi.spyOn(qualityEnhancementsApi, "replicateEstimates")
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          lines: [],
        })
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        const quality = qualityEnhancementFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 20,
          estimatedChildOccupancyRate: "0.6250",
        })
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [], totalCount: 0 } }
          }
          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [], totalCount: 0 } }
          }
          if (url === "/api/children-with-diverse-needs-funding-records") {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [quality], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockResolvedValue({ data: {} })
        http.post.mockResolvedValue({ data: undefined })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()

        // Act
        const qualityRow = wrapper
          .findAll("tr.cursor-pointer")
          .find((row) => row.text().includes(quality.lineName))
        if (!qualityRow) throw new Error("Expected the Quality Enhancement row")
        await qualityRow.trigger("click")
        await flushPromises()
        const estimateInput = wrapper.get<HTMLInputElement>("tbody input")
        await estimateInput.setValue("0.8125")
        const action = wrapper
          .findAll("button")
          .find((button) => button.text().trim() === actionLabel)
        if (!action) throw new Error(`Expected ${actionLabel} button`)
        await action.trigger("click")
        await flushPromises()

        // Assert
        expect(replicateQualityEnhancement).toHaveBeenCalledExactlyOnceWith(70)
      })

      test("when saving an edited Quality Enhancement cell, does not replicate estimates", async () => {
        // Arrange
        const actionLabel = "Save"
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          lines: [],
        })
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        const quality = qualityEnhancementFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 20,
          estimatedChildOccupancyRate: "0.6250",
        })
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [], totalCount: 0 } }
          }
          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [], totalCount: 0 } }
          }
          if (url === "/api/children-with-diverse-needs-funding-records") {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [quality], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockResolvedValue({ data: {} })
        http.post.mockResolvedValue({ data: undefined })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()

        // Act
        const qualityRow = wrapper
          .findAll("tr.cursor-pointer")
          .find((row) => row.text().includes(quality.lineName))
        if (!qualityRow) throw new Error("Expected the Quality Enhancement row")
        await qualityRow.trigger("click")
        await flushPromises()
        const estimateInput = wrapper.get<HTMLInputElement>("tbody input")
        await estimateInput.setValue("0.8125")
        const action = wrapper
          .findAll("button")
          .find((button) => button.text().trim() === actionLabel)
        if (!action) throw new Error(`Expected ${actionLabel} button`)
        await action.trigger("click")
        await flushPromises()

        // Assert
        expect(http.post).not.toHaveBeenCalled()
      })
    })
  })
})
