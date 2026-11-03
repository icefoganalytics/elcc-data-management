import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import { type FiscalPeriod } from "@/api/fiscal-periods-api"
import { type FundingSubmissionLineJsonAsIndex } from "@/api/funding-submission-line-jsons-api"
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
        const savedWorksheetUpdates: string[] = []
        httpClientMock.patch.mockImplementation(async (url) => {
          savedWorksheetUpdates.push(url)
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
        expect(savedWorksheetUpdates).toEqual([
          "/api/child-care-spaces/50",
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
            return {
              data: {
                administrationCosts: [administrationCost],
                totalCount: 1,
              },
            }
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
        vi.mocked(httpClient, true).patch.mockResolvedValue({
          data: {},
        })
        vi.mocked(httpClient, true).post.mockResolvedValue({
          data: {},
        })
        const router = mockRouter([
          {
            path: "/",
            component: {
              template: "<div />",
            },
          },
        ])
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

        await wrapper.setProps({
          month: FiscalPeriodMonths.MAY,
        })
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input")).toHaveLength(0)
      })

      test("when Administration costs fail to load, disables cross-section estimate replication", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons") {
            return {
              data: {
                fundingSubmissionLineJsons: [worksheet],
                totalCount: 1,
              },
            }
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
            return {
              data: {
                fundingSubmissionLineJson: worksheet,
              },
            }
          }
          if (url === "/api/child-care-spaces") {
            return {
              data: {
                childCareSpaces: [],
                totalCount: 0,
              },
            }
          }
          if (url === "/api/administration-costs") {
            throw new ApiOperationError("Administration costs unavailable", 503)
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          }
          throw new Error(`Unexpected GET ${url}`)
        })
        const router = mockRouter([
          {
            path: "/",
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(MonthlyWorksheetPage, {
          props: {
            centreId: 1,
            fiscalYearSlug: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          },
          global: {
            config: {
              errorHandler: vi.fn(),
            },
            plugins: [router, createPinia(), mockVuetify()],
            stubs: {
              BuildingExpenseCreateFormCard: true,
              BuildingExpensesEditTable: true,
            },
          },
        })

        // Act
        await flushPromises()

        // Assert
        const replicate = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        expect(replicate?.attributes("disabled")).toEqual("")
      })

      test("when the worksheet loads, preserves the established order of independent and JSON sections", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 44,
          centreId: 1,
          dateName: "April",
          lines: [
            {
              submissionLineId: 90,
              sectionName: "Children with Diverse Needs",
              lineName: "Toddlers",
              monthlyAmount: "54.9600",
              estimatedChildOccupancyRate: "0.0000",
              actualChildOccupancyRate: "0.0000",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
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
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
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

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.findAll("h3").map((heading) => heading.text())).toEqual([
          "Child Care Spaces",
          "Children with Diverse Needs",
          "Administration (10% of Spaces)",
          "Quality Enhancement Program",
          "Building Expenses",
        ])
      })
      test.each(["Save", "Replicate Estimates"])(
        "when a Quality Enhancement cell is edited, %s saves it without Enter",
        async (actionLabel) => {
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
          const quality = qualityEnhancementFactory.build({
            id: 70,
            centreId: 1,
            fiscalPeriodId: 4,
            categoryId: 20,
            estimatedChildOccupancyRate: "0.6250",
          })
          const http = vi.mocked(httpClient, true)
          const qualityUpdates: unknown[] = []
          const replicationRequests: string[] = []
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
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [quality], totalCount: 1 } }
            }
            return { data: { fundingSubmissionLineJson: worksheet } }
          })
          http.patch.mockImplementation(async (url, attributes) => {
            if (url === "/api/quality-enhancements/70") qualityUpdates.push(attributes)
            return { data: {} }
          })
          http.post.mockImplementation(async (url) => {
            replicationRequests.push(url)
            return { data: undefined }
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
          expect(qualityUpdates).toContainEqual({ estimatedChildOccupancyRate: "0.8125" })
          if (actionLabel === "Replicate Estimates") {
            expect(replicationRequests).toContain(
              "/api/quality-enhancements/70/replicate-estimates"
            )
          } else {
            expect(replicationRequests).toEqual([])
          }
        }
      )

      test("when one Spaces update fails, refreshes linked tables after the partial save", async () => {
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
        const spaces = [
          childCareSpaceFactory.build({ id: 40, centreId: 1, fiscalPeriodId: 4, categoryId: 9 }),
          childCareSpaceFactory.build({ id: 41, centreId: 1, fiscalPeriodId: 4, categoryId: 10 }),
        ]
        let administrationRequests = 0
        let qualityRequests = 0
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons") {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          }
          if (url === "/api/fiscal-periods") {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          }
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: spaces, totalCount: spaces.length } }
          }
          if (url === "/api/administration-costs") {
            administrationRequests += 1
            return { data: { administrationCosts: [], totalCount: 0 } }
          }
          if (url === "/api/quality-enhancements") {
            qualityRequests += 1
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        const replicationRequests: string[] = []
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/41") {
            throw new ApiOperationError("Second Spaces update failed", 503)
          }
          return { data: {} }
        })
        http.post.mockImplementation(async (url) => {
          replicationRequests.push(url)
          return { data: undefined }
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
        const initialAdministrationRequests = administrationRequests
        const initialQualityRequests = qualityRequests
        const inputs = wrapper.findAll("tbody input")
        await inputs[0]?.setValue("0.5")
        await inputs[2]?.setValue("0.75")
        const replicate = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicate) throw new Error("Expected the Replicate Estimates button")

        // Act
        await replicate.trigger("click")
        await flushPromises()

        // Assert
        expect(administrationRequests).toBeGreaterThan(initialAdministrationRequests)
        expect(qualityRequests).toBeGreaterThan(initialQualityRequests)
        expect(replicationRequests).toEqual([])
      })

      test.each([
        ["success", false],
        ["failure", true],
      ] as const)(
        "when JSON replication remains pending after a sibling %s, keeps Spaces editing locked",
        async (_outcome, failAdministration) => {
          // Arrange
          const worksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            dateName: "April",
          })
          const fiscalPeriod = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          const space = childCareSpaceFactory.build({ id: 40, centreId: 1, fiscalPeriodId: 4 })
          const administration = administrationCostFactory.build({
            id: 60,
            centreId: 1,
            fiscalPeriodId: 4,
          })
          const quality = qualityEnhancementFactory.build({
            id: 70,
            centreId: 1,
            fiscalPeriodId: 4,
          })
          const pendingReplication = Promise.withResolvers<{ data: undefined }>()
          const replicationStarted = Promise.withResolvers<void>()
          const http = vi.mocked(httpClient, true)
          http.get.mockImplementation(async (url) => {
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
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [quality], totalCount: 1 } }
            }
            return { data: { fundingSubmissionLineJson: worksheet } }
          })
          http.patch.mockResolvedValue({ data: { fundingSubmissionLineJson: worksheet } })
          http.post.mockImplementation(async (url) => {
            if (url === "/api/funding-submission-line-jsons/44/replicate-estimates") {
              replicationStarted.resolve()
              return pendingReplication.promise
            }
            if (failAdministration && url === "/api/administration-costs/60/replicate-estimates") {
              throw new ApiOperationError("Administration replication unavailable", 503)
            }
            return { data: undefined }
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
          const replicate = wrapper
            .findAll("button")
            .find((button) => button.text().includes("Replicate Estimates"))
          if (!replicate) throw new Error("Expected Replicate Estimates")

          // Act
          await replicate.trigger("click")
          await replicationStarted.promise
          await flushPromises()

          // Assert
          expect(wrapper.get<HTMLInputElement>("tbody input").element.readOnly).toEqual(true)
        }
      )

      test.each([
        ["AdministrationCostCreateFormCard", "Add Administration Cost"],
        ["QualityEnhancementCreateFormCard", "Add Quality Enhancement"],
      ])(
        "when a %s unmounts during month navigation, releases its lock without unlocking a newer creation",
        async (formName, addLabel) => {
          // Arrange
          const aprilWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "April",
            lines: [],
          })
          const mayWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 45,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "May",
            lines: [],
          })
          const april = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          const may = fiscalPeriodFactory.build({
            id: 5,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.MAY,
          })
          vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
            if (url === "/api/funding-submission-line-jsons") {
              const worksheet =
                config?.params?.where?.dateName === "April" ? aprilWorksheet : mayWorksheet
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            }
            if (url === "/api/fiscal-periods") {
              const period = config?.params?.where?.month === FiscalPeriodMonths.APRIL ? april : may
              return { data: { fiscalPeriods: [period], totalCount: 1 } }
            }
            if (url === "/api/administration-costs") {
              return { data: { administrationCosts: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [], totalCount: 0 } }
            }
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [], totalCount: 0 } }
            }
            if (url === "/api/administration-cost-categories") {
              return { data: { administrationCostCategories: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancement-categories") {
              return { data: { qualityEnhancementCategories: [], totalCount: 0 } }
            }
            return { data: { fundingSubmissionLineJson: mayWorksheet } }
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
          const firstAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!firstAdd) throw new Error(`Expected ${addLabel}`)
          await firstAdd.trigger("click")
          const previousForm = wrapper.getComponent({ name: formName })
          previousForm.vm.$emit("saving", true)
          await flushPromises()

          // Act & Assert
          await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
          await flushPromises()
          const save = wrapper.findAll("button").find((button) => button.text() === "Save")
          if (!save) throw new Error("Expected worksheet Save")
          expect(save.attributes("disabled")).toEqual(undefined)

          const nextAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!nextAdd) throw new Error(`Expected ${addLabel}`)
          await nextAdd.trigger("click")
          const currentForm = wrapper.getComponent({ name: formName })
          currentForm.vm.$emit("saving", true)
          previousForm.vm.$emit("saving", false)
          await flushPromises()
          expect(save.attributes("disabled")).toEqual("")

          currentForm.vm.$emit("saving", false)
          await flushPromises()
          expect(save.attributes("disabled")).toEqual(undefined)
        }
      )
    })
  })
})
