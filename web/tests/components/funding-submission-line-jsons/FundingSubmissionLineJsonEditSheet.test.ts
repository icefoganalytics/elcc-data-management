import { createPinia } from "pinia"
import { nextTick } from "vue"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"
import FundingSubmissionLineJsonSectionTable from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonSectionTable.vue"
import { mockRouter, mockVuetify } from "@/tests/support"

describe("web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue", () => {
  describe("worksheet editing", () => {
    test("when a Child Care Spaces rate changes, propagates named dependent sections, saves each source separately, and replicates estimates", async () => {
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
        fundingSubmissionLineId: 1,
        lineName: "Infants",
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
      const [childCareSpaceLine] = childCareSpacesTable.props("lines")
      childCareSpaceLine.estimatedChildOccupancyRate = "0.5000"
      childCareSpaceLine.actualChildOccupancyRate = "0.2500"

      // Act
      await childCareSpacesTable.vm.$emit("lineChanged", {
        line: childCareSpaceLine,
        lineIndex: 0,
      })
      await nextTick()
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
        administrationLines: administrationTable.props("lines"),
        qualityEnhancementProgramLines: qualityEnhancementProgramTable.props("lines"),
        patches: httpClientMock.patch.mock.calls,
        posts: httpClientMock.post.mock.calls,
      }).toEqual({
        administrationLines: [
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "5.0000",
            actualComputedTotal: "2.5000",
          }),
        ],
        qualityEnhancementProgramLines: [
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "10.0000",
            actualComputedTotal: "5.0000",
          }),
        ],
        patches: [
          [
            "/api/child-care-spaces/1",
            {
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.2500",
            },
          ],
          [
            "/api/funding-submission-line-jsons/11",
            {
              lines: [
                expect.objectContaining({
                  sectionName: "Administration (10% of Spaces)",
                  estimatedChildOccupancyRate: "0.5000",
                  actualChildOccupancyRate: "0.2500",
                }),
                expect.objectContaining({
                  sectionName: "Quality Enhancement Program",
                  estimatedChildOccupancyRate: "0.5000",
                  actualChildOccupancyRate: "0.2500",
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
                  estimatedChildOccupancyRate: "0.5000",
                  actualChildOccupancyRate: "0.2500",
                }),
                expect.objectContaining({
                  sectionName: "Quality Enhancement Program",
                  estimatedChildOccupancyRate: "0.5000",
                  actualChildOccupancyRate: "0.2500",
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
  })
})
