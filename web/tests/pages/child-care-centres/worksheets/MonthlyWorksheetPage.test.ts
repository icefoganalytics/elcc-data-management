import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import { type FiscalPeriod } from "@/api/fiscal-periods-api"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
  fiscalPeriodFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"
import { mockHttpGetRoutes, mockRouter, mockVuetify } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("worksheet navigation", () => {
      test("when one worksheet read fails while another is pending, keeps loading", async () => {
        // Arrange
        const fiscalPeriods = Promise.withResolvers<{
          data: { fiscalPeriods: FiscalPeriod[]; totalCount: number }
        }>()
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            throw new ApiOperationError("Worksheet unavailable", 503)
          },
          "/api/fiscal-periods": async () => {
            return fiscalPeriods.promise
          },
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(MonthlyWorksheetPage, {
          props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Assert
        expect(wrapper.text()).toContain("Loading worksheets")
      })

      test.each([
        ["authentication", AuthenticationRequiredError],
        ["challenge", CloudflareChallengeError],
      ] as const)(
        "when a delayed %s failure follows an expected worksheet failure, forwards the original recovery error",
        async (_kind, RecoveryError) => {
          // Arrange
          const fiscalPeriods = Promise.withResolvers<{
            data: { fiscalPeriods: FiscalPeriod[]; totalCount: number }
          }>()
          const recoveryError = new RecoveryError()
          mockHttpGetRoutes({
            "/api/funding-submission-line-jsons": async () => {
              throw new ApiOperationError("Worksheet unavailable", 503)
            },
            "/api/fiscal-periods": async () => {
              return fiscalPeriods.promise
            },
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const errorHandler = vi.fn()
          mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              config: { errorHandler },
              plugins: [router, mockVuetify()],
            },
          })
          await flushPromises()

          // Act
          fiscalPeriods.reject(recoveryError)
          await flushPromises()

          // Assert
          const receivedErrors = errorHandler.mock.calls.map(([error]) => error)
          expect(receivedErrors).toEqual([recoveryError])
        }
      )

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
        mockHttpGetRoutes({
          "/api/fiscal-periods": async (config) => {
            if (config?.params?.where?.month === "may") {
              return mayFiscalPeriodList.promise
            }

            return { data: { fiscalPeriods: [aprilFiscalPeriod], totalCount: 1 } }
          },
          "/api/funding-submission-line-jsons": async (config) => {
            const worksheet =
              config?.params?.where?.dateName === "May" ? mayWorksheet : aprilWorksheet
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          },
          "/api/administration-costs": async () => {
            return {
              data: {
                administrationCosts: [administrationCost],
                totalCount: 1,
              },
            }
          },
          "/api/child-care-spaces": async () => {
            return {
              data: {
                childCareSpaces: [childCareSpace],
                totalCount: 1,
              },
            }
          },
          "/api/children-with-diverse-needs-funding-records": async () => {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          },
          "/api/quality-enhancements": async () => {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return { data: { fundingSubmissionLineJson: aprilWorksheet } }
          },
          "/api/funding-submission-line-jsons/55": async () => {
            return { data: { fundingSubmissionLineJson: aprilWorksheet } }
          },
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
            plugins: [router, mockVuetify()],
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
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            return {
              data: {
                fundingSubmissionLineJsons: [worksheet],
                totalCount: 1,
              },
            }
          },
          "/api/fiscal-periods": async () => {
            return {
              data: {
                fiscalPeriods: [
                  fiscalPeriodFactory.build({
                    id: 4,
                    fiscalYear: "2024-25",
                    month: FiscalPeriodMonths.APRIL,
                  }),
                ],
                totalCount: 1,
              },
            }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return {
              data: {
                fundingSubmissionLineJson: worksheet,
              },
            }
          },
          "/api/child-care-spaces": async () => {
            return {
              data: {
                childCareSpaces: [],
                totalCount: 0,
              },
            }
          },
          "/api/administration-costs": async () => {
            throw new ApiOperationError("Administration costs unavailable", 503)
          },
          "/api/children-with-diverse-needs-funding-records": async () => {
            return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
          },
          "/api/quality-enhancements": async () => {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          },
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
            plugins: [router, mockVuetify()],
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

      test("when the worksheet loads, displays its sections in worksheet order", async () => {
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
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          },
          "/api/fiscal-periods": async () => {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          },
          "/api/child-care-spaces": async () => {
            return { data: { childCareSpaces: [], totalCount: 0 } }
          },
          "/api/administration-costs": async () => {
            return { data: { administrationCosts: [], totalCount: 0 } }
          },
          "/api/children-with-diverse-needs-funding-records": async (config) => {
            if (config?.params?.where?.centreId === 1 && config.params.where.fiscalPeriodId === 4) {
              return {
                data: {
                  childrenWithDiverseNeedsFundingRecords: [childrenWithDiverseNeedsFundingRecord],
                  totalCount: 1,
                },
              }
            }

            return { data: { fundingSubmissionLineJson: worksheet } }
          },
          "/api/quality-enhancements": async () => {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return { data: { fundingSubmissionLineJson: worksheet } }
          },
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

        // Assert
        const sectionHeadings = wrapper.findAll("h3").map((heading) => heading.text())
        expect(sectionHeadings).toEqual([
          "Child Care Spaces",
          "Children with Diverse Needs",
          "Administration (10% of Spaces)",
          "Quality Enhancement Program",
          "Building Expenses",
        ])
      })

      test("when the worksheet loads, renders ledger-owned Diverse Needs", async () => {
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
        const fiscalPeriod = fiscalPeriodFactory.build({
          id: 4,
          fundingPeriodId: 1,
          fiscalYear: "2024-25",
          month: FiscalPeriodMonths.APRIL,
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons": async () => {
            return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
          },
          "/api/fiscal-periods": async () => {
            return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
          },
          "/api/child-care-spaces": async () => {
            return { data: { childCareSpaces: [], totalCount: 0 } }
          },
          "/api/administration-costs": async () => {
            return { data: { administrationCosts: [], totalCount: 0 } }
          },
          "/api/children-with-diverse-needs-funding-records": async (config) => {
            if (config?.params?.where?.centreId === 1 && config.params.where.fiscalPeriodId === 4) {
              return {
                data: {
                  childrenWithDiverseNeedsFundingRecords: [childrenWithDiverseNeedsFundingRecord],
                  totalCount: 1,
                },
              }
            }

            return { data: { fundingSubmissionLineJson: worksheet } }
          },
          "/api/quality-enhancements": async () => {
            return { data: { qualityEnhancements: [], totalCount: 0 } }
          },
          "/api/funding-submission-line-jsons/44": async () => {
            return { data: { fundingSubmissionLineJson: worksheet } }
          },
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

        // Assert
        expect(wrapper.text()).toContain("Ledger Diverse Needs")
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
          mockHttpGetRoutes({
            "/api/funding-submission-line-jsons": async () => {
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            },
            "/api/fiscal-periods": async () => {
              return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
            },
            "/api/child-care-spaces": async () => {
              return { data: { childCareSpaces: [space], totalCount: 1 } }
            },
            "/api/administration-costs": async () => {
              return { data: { administrationCosts: [administration], totalCount: 1 } }
            },
            "/api/children-with-diverse-needs-funding-records": async () => {
              return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
            },
            "/api/quality-enhancements": async () => {
              return { data: { qualityEnhancements: [quality], totalCount: 1 } }
            },
            "/api/funding-submission-line-jsons/44": async () => {
              return { data: { fundingSubmissionLineJson: worksheet } }
            },
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
              plugins: [router, mockVuetify()],
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
        ["authentication", new AuthenticationRequiredError()],
        ["challenge", new CloudflareChallengeError()],
        ["unexpected", new Error("Unexpected refresh failure")],
      ])(
        "when a diverse need creation refresh has an %s failure, forwards it to the application boundary",
        async (_kind, error) => {
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
          let hasLoadedDiverseNeeds = false
          mockHttpGetRoutes({
            "/api/funding-submission-line-jsons": async () => {
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            },
            "/api/fiscal-periods": async () => {
              return { data: { fiscalPeriods: [fiscalPeriod], totalCount: 1 } }
            },
            "/api/child-care-spaces": async () => {
              return { data: { childCareSpaces: [], totalCount: 0 } }
            },
            "/api/administration-costs": async () => {
              return { data: { administrationCosts: [], totalCount: 0 } }
            },
            "/api/quality-enhancements": async () => {
              return { data: { qualityEnhancements: [], totalCount: 0 } }
            },
            "/api/children-with-diverse-needs-funding-records": async () => {
              if (hasLoadedDiverseNeeds) throw error
              hasLoadedDiverseNeeds = true
              return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
            },
            "/api/children-with-diverse-needs-funding-categories": async () => {
              return { data: { childrenWithDiverseNeedsFundingCategories: [], totalCount: 0 } }
            },
            "/api/funding-submission-line-jsons/44": async () => {
              return { data: { fundingSubmissionLineJson: worksheet } }
            },
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const errorHandler = vi.fn()
          const wrapper = mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              config: { errorHandler },
              plugins: [router, mockVuetify()],
              stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
            },
          })
          await flushPromises()
          const addDiverseNeed = wrapper
            .findAll("button")
            .find((button) => button.text() === "Add Diverse Need")
          if (!addDiverseNeed) throw new Error("Expected Add Diverse Need")
          await addDiverseNeed.trigger("click")

          // Act
          wrapper
            .getComponent({ name: "ChildrenWithDiverseNeedsFundingRecordsCreateFormCard" })
            .vm.$emit("created", 91)
          await flushPromises()

          // Assert
          const receivedErrors = errorHandler.mock.calls.map(([error]) => error)
          expect(receivedErrors).toEqual([error])
        }
      )
    })
  })
})
