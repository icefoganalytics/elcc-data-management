import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import administrationCostsApi from "@/api/administration-costs-api"
import qualityEnhancementsApi from "@/api/quality-enhancements-api"
import ApiOperationError from "@/api/errors/api-operation-error"

import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  childCareSpaceSummariesFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"
import { mockHttpGetRoutes, mountWithDefaultPlugins } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("Spaces autosave integration", () => {
      test("when a committed Spaces edit saves, refreshes the Administration total", async () => {
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
            return {
              data: { childCareSpaces, totalCount: 1, summaries: childCareSpaceSummariesFactory.build() },
            }
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
        http.patch.mockResolvedValue({
          data: { childCareSpace: { ...childCareSpaces[0], estimatedChildOccupancyRate: "0.5" } },
        })
        const wrapper = mountWithDefaultPlugins(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()
        listAdministrationCosts.mockResolvedValue({
          administrationCosts: [refreshedAdministrationCost],
          totalCount: 1,
        })

        // Act
        const spaces = wrapper.getComponent({ name: "ChildCareSpacesEditDataTableVirtual" })
        await spaces.get("tr.cursor-pointer").trigger("click")
        await flushPromises()
        const estimate = spaces.get("tbody input")
        await estimate.setValue("0.5")
        await estimate.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(
          wrapper
            .getComponent({ name: "AdministrationCostEditTable" })
            .get("tfoot td:nth-child(4)")
            .text()
        ).toEqual("$20")
      })

      test("when a committed Spaces edit saves, refreshes the Quality Enhancement total", async () => {
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
            return {
              data: { childCareSpaces, totalCount: 1, summaries: childCareSpaceSummariesFactory.build() },
            }
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
        http.patch.mockResolvedValue({
          data: { childCareSpace: { ...childCareSpaces[0], estimatedChildOccupancyRate: "0.5" } },
        })
        const wrapper = mountWithDefaultPlugins(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()
        listQualityEnhancements.mockResolvedValue({
          qualityEnhancements: [refreshedQualityEnhancement],
          totalCount: 1,
        })

        // Act
        const spaces = wrapper.getComponent({ name: "ChildCareSpacesEditDataTableVirtual" })
        await spaces.get("tr.cursor-pointer").trigger("click")
        await flushPromises()
        const estimate = spaces.get("tbody input")
        await estimate.setValue("0.5")
        await estimate.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(
          wrapper
            .getComponent({ name: "QualityEnhancementEditTable" })
            .get("tfoot td:nth-child(4)")
            .text()
        ).toEqual("$40")
      })

      test("when the active Spaces edit fails to save, does not replicate estimates", async () => {
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
            return {
              data: { childCareSpaces, totalCount: 1, summaries: childCareSpaceSummariesFactory.build() },
            }
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
        http.patch.mockRejectedValue(new ApiOperationError("Spaces update failed", 503))
        http.post.mockResolvedValue({ data: undefined })
        const wrapper = mountWithDefaultPlugins(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })
        await flushPromises()
        const replicate = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicate) throw new Error("Expected the Replicate Estimates button")

        // Act
        const spaces = wrapper.getComponent({ name: "ChildCareSpacesEditDataTableVirtual" })
        await spaces.get("tr.cursor-pointer").trigger("click")
        await flushPromises()
        await spaces.get("tbody input").setValue("0.5")
        await replicate.trigger("click")
        await flushPromises()

        // Assert
        expect(http.post).not.toHaveBeenCalled()
      })
    })
  })
})
