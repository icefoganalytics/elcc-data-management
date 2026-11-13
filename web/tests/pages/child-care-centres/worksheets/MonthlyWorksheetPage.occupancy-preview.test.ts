import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("linked occupancy previews", () => {
      test.each([
        ["Administration occupancy", "AdministrationCostEditTable", 3, "2.5"],
        ["Administration total", "AdministrationCostEditTable", 4, "$175"],
        ["Quality Enhancement occupancy", "QualityEnhancementEditTable", 3, "2.5"],
        ["Quality Enhancement total", "QualityEnhancementEditTable", 4, "$17.5"],
      ] as const)(
        "when Spaces occupancy changes, previews the linked %s",
        async (_description, componentName, columnNumber, expectedValue) => {
          // Arrange
          const worksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            dateName: "April",
            lines: [],
          })
          const childrenWithDiverseNeedsFundingRecord =
            childrenWithDiverseNeedsFundingRecordFactory.build({
              id: 91,
              centreId: 1,
              fiscalPeriodId: 4,
              categoryId: 90,
              lineName: "Ledger Diverse Needs",
            })
          const space = childCareSpaceFactory.build({
            id: 51,
            centreId: 1,
            fiscalPeriodId: 4,
            categoryId: 8,
            lineName: "Toddlers",
          })
          const administration = administrationCostFactory.build({
            id: 61,
            centreId: 1,
            fiscalPeriodId: 4,
            childCareSpaceCategoryId: 8,
            lineName: "Renamed Administration",
            monthlyAmount: "70.0000",
          })
          const quality = qualityEnhancementFactory.build({
            id: 71,
            centreId: 1,
            fiscalPeriodId: 4,
            childCareSpaceCategoryId: 8,
            lineName: "Renamed Quality Enhancement",
            monthlyAmount: "7.0000",
          })
          const fiscalPeriod = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
            if (url === "/api/funding-submission-line-jsons") {
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            }
            if (url === "/api/fiscal-periods") {
              return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
            }
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [space], totalCount: 1 } }
            }
            if (url === "/api/administration-costs") {
              return { data: { administrationCosts: [administration], totalCount: 1 } }
            }

            if (
              url === "/api/children-with-diverse-needs-funding-records" &&
              config?.params?.where?.centreId === 1 &&
              config.params.where.fiscalPeriodId === 4
            ) {
              return {
                data: {
                  childrenWithDiverseNeedsFundingRecords: [childrenWithDiverseNeedsFundingRecord],
                  totalCount: 1,
                },
              }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [quality], totalCount: 1 } }
            }
            return { data: { fundingSubmissionLineJson: worksheet } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const wrapper = mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              plugins: [router, mockVuetify()],
              stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
            },
          })

          // Act
          await flushPromises()
          const estimatedSpaces = wrapper.get("input")
          await estimatedSpaces.setValue("2.5000")
          await estimatedSpaces.trigger("change")
          await flushPromises()

          // Assert
          const previewCell = wrapper
            .getComponent({ name: componentName })
            .get(`tbody tr.cursor-pointer td:nth-child(${columnNumber})`)
          expect(previewCell.text()).toEqual(expectedValue)
        }
      )

      test("when Spaces occupancy changes, preserves independent Children with Diverse Needs occupancy", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          lines: [],
        })
        const childrenWithDiverseNeedsFundingRecord =
          childrenWithDiverseNeedsFundingRecordFactory.build({
            id: 91,
            centreId: 1,
            fiscalPeriodId: 4,
            categoryId: 90,
            lineName: "Ledger Diverse Needs",
          })
        const space = childCareSpaceFactory.build({
          id: 51,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 8,
          lineName: "Toddlers",
        })
        const administration = administrationCostFactory.build({
          id: 61,
          centreId: 1,
          fiscalPeriodId: 4,
          childCareSpaceCategoryId: 8,
          lineName: "Renamed Administration",
          monthlyAmount: "70.0000",
        })
        const quality = qualityEnhancementFactory.build({
          id: 71,
          centreId: 1,
          fiscalPeriodId: 4,
          childCareSpaceCategoryId: 8,
          lineName: "Renamed Quality Enhancement",
          monthlyAmount: "7.0000",
        })
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space], totalCount: 1 } }
          }
          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [administration], totalCount: 1 } }
          }

          if (
            url === "/api/children-with-diverse-needs-funding-records" &&
            config?.params?.where?.centreId === 1 &&
            config.params.where.fiscalPeriodId === 4
          ) {
            return {
              data: {
                childrenWithDiverseNeedsFundingRecords: [childrenWithDiverseNeedsFundingRecord],
                totalCount: 1,
              },
            }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [quality], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            plugins: [router, mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })

        // Act
        await flushPromises()
        const estimatedSpaces = wrapper.get("input")
        await estimatedSpaces.setValue("2.5000")
        await estimatedSpaces.trigger("change")
        await flushPromises()

        // Assert
        const occupancyCell = wrapper
          .getComponent({ name: "ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual" })
          .get("tbody tr.cursor-pointer td:nth-child(3)")
        expect(occupancyCell.text()).toEqual("0")
      })

      test("when Spaces occupancy changes, does not persist preview values before saving", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          lines: [],
        })
        const childrenWithDiverseNeedsFundingRecord =
          childrenWithDiverseNeedsFundingRecordFactory.build({
            id: 91,
            centreId: 1,
            fiscalPeriodId: 4,
            categoryId: 90,
            lineName: "Ledger Diverse Needs",
          })
        const space = childCareSpaceFactory.build({
          id: 51,
          centreId: 1,
          fiscalPeriodId: 4,
          categoryId: 8,
          lineName: "Toddlers",
        })
        const administration = administrationCostFactory.build({
          id: 61,
          centreId: 1,
          fiscalPeriodId: 4,
          childCareSpaceCategoryId: 8,
          lineName: "Renamed Administration",
          monthlyAmount: "70.0000",
        })
        const quality = qualityEnhancementFactory.build({
          id: 71,
          centreId: 1,
          fiscalPeriodId: 4,
          childCareSpaceCategoryId: 8,
          lineName: "Renamed Quality Enhancement",
          monthlyAmount: "7.0000",
        })
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space], totalCount: 1 } }
          }
          if (url === "/api/administration-costs") {
            return { data: { administrationCosts: [administration], totalCount: 1 } }
          }

          if (
            url === "/api/children-with-diverse-needs-funding-records" &&
            config?.params?.where?.centreId === 1 &&
            config.params.where.fiscalPeriodId === 4
          ) {
            return {
              data: {
                childrenWithDiverseNeedsFundingRecords: [childrenWithDiverseNeedsFundingRecord],
                totalCount: 1,
              },
            }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [quality], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: {
            plugins: [router, mockVuetify()],
            stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
          },
        })

        // Act
        await flushPromises()
        const estimatedSpaces = wrapper.get("input")
        await estimatedSpaces.setValue("2.5000")
        await estimatedSpaces.trigger("change")
        await flushPromises()

        // Assert
        expect(vi.mocked(httpClient, true).patch).not.toHaveBeenCalled()
      })
    })
  })
})
