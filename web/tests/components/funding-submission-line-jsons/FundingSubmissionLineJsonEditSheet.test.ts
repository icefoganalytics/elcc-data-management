import { createPinia } from "pinia"
import { nextTick } from "vue"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"
import FundingSubmissionLineJsonSectionTable from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonSectionTable.vue"
import { mockRouter, mockVuetify } from "@/tests/support"

describe("web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue", () => {
  describe("worksheet editing", () => {
    test("when a renamed category's occupancy changes, updates visible totals and linked sections, saves separately, and replicates", async () => {
      // Arrange
      const fundingSubmissionLineJson = {
        id: 11,
        centreId: 1,
        fiscalYear: "2024/25",
        dateName: "April",
        dateStart: "2024-04-01",
        dateEnd: "2024-04-30",
        createdAt: "2024-04-01",
        updatedAt: "2024-04-01",
        lines: [
          {
            submissionLineId: 2,
            childCareSpaceCategoryId: 9,
            sectionName: "Administration (10% of Spaces)",
            lineName: "Infants",
            monthlyAmount: "10.0000",
            estimatedChildOccupancyRate: "0.0000",
            actualChildOccupancyRate: "0.0000",
            estimatedComputedTotal: "0.0000",
            actualComputedTotal: "0.0000",
          },
          {
            submissionLineId: 3,
            childCareSpaceCategoryId: 9,
            sectionName: "Quality Enhancement Program",
            lineName: "Infants",
            monthlyAmount: "20.0000",
            estimatedChildOccupancyRate: "0.0000",
            actualChildOccupancyRate: "0.0000",
            estimatedComputedTotal: "0.0000",
            actualComputedTotal: "0.0000",
          },
        ],
      }
      const childCareSpace = {
        id: 1,
        centreId: 1,
        fiscalPeriodId: 1,
        categoryId: 9,
        lineName: "Renamed Infant Cohort",
        monthlyAmount: "100.0000",
        estimatedChildOccupancyRate: "0.0000",
        actualChildOccupancyRate: "0.0000",
        estimatedComputedTotal: "0.0000",
        actualComputedTotal: "0.0000",
        createdAt: "2024-04-01",
        updatedAt: "2024-04-01",
        policy: {
          show: true,
          create: false,
          update: true,
          destroy: false,
        },
      }
      const httpClientMock = vi.mocked(httpClient, true)
      httpClientMock.get.mockImplementation(async (url) => {
        if (url === "/api/funding-submission-line-jsons/11") {
          return { data: { fundingSubmissionLineJson } }
        }
        if (url === "/api/child-care-spaces") {
          return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
        }

        throw new Error(`Unexpected GET ${url}`)
      })
      httpClientMock.patch.mockImplementation(async (url, attributes) => {
        if (url === "/api/child-care-spaces/1") {
          Object.assign(childCareSpace, attributes)
          return { data: {} }
        }
        if (url === "/api/funding-submission-line-jsons/11") {
          Object.assign(fundingSubmissionLineJson, attributes)
          return { data: {} }
        }

        throw new Error(`Unexpected PATCH ${url}`)
      })
      httpClientMock.post.mockResolvedValue({ data: {} })
      const router = mockRouter([
        {
          path: "/",
          component: { template: "<div />" },
        },
      ])
      await router.push("/")
      await router.isReady()
      const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
        props: {
          fundingSubmissionLineJsonId: 11,
          centreId: 1,
          fiscalPeriodId: 1,
        },
        global: {
          plugins: [router, createPinia(), mockVuetify()],
        },
      })
      await flushPromises()
      const sectionTables = wrapper.findAllComponents(FundingSubmissionLineJsonSectionTable)
      const [childCareSpacesTable, administrationTable, qualityEnhancementProgramTable] =
        sectionTables
      const [estimateInput, actualInput] = childCareSpacesTable.findAll("input")

      // Act
      await estimateInput.setValue("0.5")
      await estimateInput.trigger("change")
      await actualInput.setValue("0.25")
      await actualInput.trigger("change")
      await nextTick()
      const childCareSpaceTotals = childCareSpacesTable
        .findAll("tfoot td")
        .map((cell) => cell.text())
      const saveButton = wrapper.findAll("button").find((button) => button.text().includes("Save"))
      if (saveButton === undefined) throw new Error("Expected Save button")

      await saveButton.trigger("click")
      await flushPromises()

      const replicateEstimatesButton = wrapper
        .findAll("button")
        .find((button) => button.text().includes("Replicate Estimates"))
      if (replicateEstimatesButton === undefined)
        throw new Error("Expected Replicate Estimates button")

      await replicateEstimatesButton.trigger("click")
      await flushPromises()

      // Assert
      expect({
        childCareSpaceTotals,
        administrationLines: administrationTable.props("lines"),
        qualityEnhancementProgramLines: qualityEnhancementProgramTable.props("lines"),
        patches: httpClientMock.patch.mock.calls,
        posts: httpClientMock.post.mock.calls,
      }).toEqual({
        childCareSpaceTotals: ["SECTION TOTAL", "", "0.5", "$50.00", "0.3", "$25.00"],
        administrationLines: [
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "5.0000",
            actualComputedTotal: "2.5000",
          }),
        ],
        qualityEnhancementProgramLines: [
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "10.0000",
            actualComputedTotal: "5.0000",
          }),
        ],
        patches: [
          [
            "/api/child-care-spaces/1",
            {
              estimatedChildOccupancyRate: "0.5",
              actualChildOccupancyRate: "0.25",
            },
          ],
          [
            "/api/funding-submission-line-jsons/11",
            {
              lines: [
                expect.objectContaining({
                  sectionName: "Administration (10% of Spaces)",
                  estimatedChildOccupancyRate: "0.5",
                  actualChildOccupancyRate: "0.25",
                }),
                expect.objectContaining({
                  sectionName: "Quality Enhancement Program",
                  estimatedChildOccupancyRate: "0.5",
                  actualChildOccupancyRate: "0.25",
                }),
              ],
            },
          ],
          [
            "/api/funding-submission-line-jsons/11",
            {
              lines: [
                expect.objectContaining({
                  sectionName: "Administration (10% of Spaces)",
                  estimatedChildOccupancyRate: "0.5",
                  actualChildOccupancyRate: "0.25",
                }),
                expect.objectContaining({
                  sectionName: "Quality Enhancement Program",
                  estimatedChildOccupancyRate: "0.5",
                  actualChildOccupancyRate: "0.25",
                }),
              ],
            },
          ],
        ],
        posts: [
          ["/api/funding-submission-line-jsons/11/replicate-estimates"],
          ["/api/child-care-spaces/1/replicate-estimates"],
        ],
      })
    })

    test.each(["/api/child-care-spaces", "/api/funding-submission-line-jsons/11"])(
      "when %s fails to load, withholds editing until both worksheet sources reload successfully",
      async (failedUrl) => {
        // Arrange
        const childCareSpace = {
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Infants",
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
          estimatedComputedTotal: "0.0000",
          actualComputedTotal: "0.0000",
        }
        const fundingSubmissionLineJson = {
          id: 11,
          dateName: "April",
          dateStart: "2024-04-01",
          lines: [],
        }
        let isRequestFailing = true
        const loadErrors: unknown[] = []
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockImplementation(async (url) => {
          if (isRequestFailing && url === failedUrl) {
            throw new Error("Worksheet source unavailable")
          }

          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: {
            plugins: [router, createPinia(), mockVuetify()],
            config: {
              errorHandler: (error) => loadErrors.push(error),
            },
          },
        })
        await flushPromises()
        const failedView = {
          buttons: wrapper.findAll("button").map((button) => button.text()),
          sectionCount: wrapper.findAllComponents(FundingSubmissionLineJsonSectionTable).length,
        }

        // Act
        isRequestFailing = false
        await wrapper.get("button").trigger("click")
        await flushPromises()
        const recoveredView = {
          buttons: wrapper.findAll("button").map((button) => button.text()),
          categoryLabel: wrapper.get("tbody td").text(),
          errorCount: wrapper.findAll(".v-alert").length,
        }

        // Assert
        expect({ failedView, recoveredView }).toEqual({
          failedView: {
            buttons: ["Reload Worksheet"],
            sectionCount: 0,
          },
          recoveredView: {
            buttons: ["Save", "Replicate Estimates"],
            categoryLabel: "Infants",
            errorCount: 0,
          },
        })
        wrapper.unmount()
      }
    )
  })
})
