import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import administrationCostsApi from "@/api/administration-costs-api"
import qualityEnhancementsApi from "@/api/quality-enhancements-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"
import { mockHttpGetRoutes, mockRouter, mockVuetify } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("partial-save recovery", () => {
      test("when one Spaces update fails, refreshes the Administration total", async () => {
        // Arrange
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
        const childCareSpaces = [
          childCareSpaceFactory.build({ id: 40, centreId: 1, fiscalPeriodId: 4, categoryId: 9 }),
          childCareSpaceFactory.build({ id: 41, centreId: 1, fiscalPeriodId: 4, categoryId: 10 }),
        ]
        const administrationCost = administrationCostFactory.build({
          id: 60,
          centreId: 1,
          fiscalPeriodId: 4,
          lineName: "Administration Infant Cohort",
          estimatedComputedTotal: "10.0000",
        })
        const refreshedAdministrationCost = administrationCostFactory.build({
          ...administrationCost,
          estimatedComputedTotal: "20.0000",
        })
        const listAdministrationCosts = vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [administrationCost],
          totalCount: 1,
        })
        const http = vi.mocked(httpClient, true)
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          },
          "/api/fiscal-periods": async () => {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          },
          "/api/child-care-spaces": async () => {
            return { data: { childCareSpaces, totalCount: 2 } }
          },
          "/api/children-with-diverse-needs-funding-records": async () => {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          },
          "/api/quality-enhancements": async () => {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return { data: { fundingSubmissionLineJson: worksheet } }
          },
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/41") {
            throw new ApiOperationError("Second Spaces update failed", 503)
          }
          return { data: {} }
        })
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
        listAdministrationCosts.mockResolvedValue({
          administrationCosts: [refreshedAdministrationCost],
          totalCount: 1,
        })
        const replicate = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicate) throw new Error("Expected the Replicate Estimates button")

        // Act
        const inputs = wrapper.findAll("tbody input")
        await inputs[0].setValue("0.5")
        await inputs[2].setValue("0.75")
        await replicate.trigger("click")
        await flushPromises()

        // Assert
        expect(
          wrapper
            .getComponent({ name: "AdministrationCostEditTable" })
            .get("tbody tr.cursor-pointer td:nth-child(4)")
            .text()
        ).toEqual("$20.00")
      })

      test("when one Spaces update fails, refreshes the Quality Enhancement total", async () => {
        // Arrange
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
        const childCareSpaces = [
          childCareSpaceFactory.build({ id: 40, centreId: 1, fiscalPeriodId: 4, categoryId: 9 }),
          childCareSpaceFactory.build({ id: 41, centreId: 1, fiscalPeriodId: 4, categoryId: 10 }),
        ]
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 70,
          centreId: 1,
          fiscalPeriodId: 4,
          lineName: "Quality Enhancement Infant Cohort",
          estimatedComputedTotal: "30.0000",
        })
        const refreshedQualityEnhancement = qualityEnhancementFactory.build({
          ...qualityEnhancement,
          estimatedComputedTotal: "40.0000",
        })
        const listQualityEnhancements = vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [qualityEnhancement],
          totalCount: 1,
        })
        const http = vi.mocked(httpClient, true)
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          },
          "/api/fiscal-periods": async () => {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          },
          "/api/child-care-spaces": async () => {
            return { data: { childCareSpaces, totalCount: 2 } }
          },
          "/api/administration-costs": async () => {
            return { data: { administrationCosts: [], totalCount: 0 } }
          },
          "/api/children-with-diverse-needs-funding-records": async () => {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return { data: { fundingSubmissionLineJson: worksheet } }
          },
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/41") {
            throw new ApiOperationError("Second Spaces update failed", 503)
          }
          return { data: {} }
        })
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
        listQualityEnhancements.mockResolvedValue({
          qualityEnhancements: [refreshedQualityEnhancement],
          totalCount: 1,
        })
        const replicate = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicate) throw new Error("Expected the Replicate Estimates button")

        // Act
        const inputs = wrapper.findAll("tbody input")
        await inputs[0].setValue("0.5")
        await inputs[2].setValue("0.75")
        await replicate.trigger("click")
        await flushPromises()

        // Assert
        expect(
          wrapper
            .getComponent({ name: "QualityEnhancementEditTable" })
            .get("tbody tr.cursor-pointer td:nth-child(4)")
            .text()
        ).toEqual("$40.00")
      })

      test("when one Spaces update fails, does not replicate the partial save", async () => {
        // Arrange
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
        const childCareSpaces = [
          childCareSpaceFactory.build({ id: 40, centreId: 1, fiscalPeriodId: 4, categoryId: 9 }),
          childCareSpaceFactory.build({ id: 41, centreId: 1, fiscalPeriodId: 4, categoryId: 10 }),
        ]
        const http = vi.mocked(httpClient, true)
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          },
          "/api/fiscal-periods": async () => {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          },
          "/api/child-care-spaces": async () => {
            return { data: { childCareSpaces, totalCount: 2 } }
          },
          "/api/administration-costs": async () => {
            return { data: { administrationCosts: [], totalCount: 0 } }
          },
          "/api/children-with-diverse-needs-funding-records": async () => {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          },
          "/api/quality-enhancements": async () => {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return { data: { fundingSubmissionLineJson: worksheet } }
          },
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/41") {
            throw new ApiOperationError("Second Spaces update failed", 503)
          }
          return { data: {} }
        })
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
        const replicate = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicate) throw new Error("Expected the Replicate Estimates button")

        // Act
        const inputs = wrapper.findAll("tbody input")
        await inputs[0].setValue("0.5")
        await inputs[2].setValue("0.75")
        await replicate.trigger("click")
        await flushPromises()

        // Assert
        expect(http.post).not.toHaveBeenCalled()
      })
    })
  })
})
