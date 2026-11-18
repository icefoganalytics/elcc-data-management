import { flushPromises } from "@vue/test-utils"

import fundingSubmissionLineJsonsApi from "@/api/funding-submission-line-jsons-api"
import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

import { mockHttpGetRoutes, mountWithDefaultPlugins } from "@/tests/support"
import { fundingSubmissionLineJsonFactory } from "@/tests/factories"

import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"

describe("web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue", () => {
  describe("FundingSubmissionLineJsonEditSheet", () => {
    describe("JSON section editing", () => {
      test("when a JSON section occupancy changes, recalculates its displayed totals", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => ({
            data: { fundingSubmissionLineJson: worksheet },
          }),
        })
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11 },
        })
        await flushPromises()

        // Act
        const [estimate, actual] = wrapper.findAll("tbody input")
        await estimate.setValue("0.5")
        await estimate.trigger("change")
        await actual.setValue("0.25")
        await actual.trigger("change")

        // Assert
        const totals = wrapper.findAll("tfoot td:nth-child(4), tfoot td:nth-child(6)")
        expect(totals.map((cell) => cell.text())).toEqual(["$50", "$25"])
      })

      test("when Save is clicked, persists the edited JSON section", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => ({
            data: { fundingSubmissionLineJson: worksheet },
          }),
        })
        const updateWorksheet = vi.spyOn(fundingSubmissionLineJsonsApi, "update")
        vi.mocked(httpClient, true).patch.mockResolvedValue({
          data: { fundingSubmissionLineJson: worksheet },
        })
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11 },
        })
        await flushPromises()

        // Act
        const estimate = wrapper.get("tbody input")
        await estimate.setValue("0.5")
        await estimate.trigger("change")
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(updateWorksheet).toHaveBeenCalledExactlyOnceWith(11, {
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0.5",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "50.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
      })

      test("when a JSON save is pending, keeps its inputs read only", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => ({
            data: { fundingSubmissionLineJson: worksheet },
          }),
        })
        const save = Promise.withResolvers<{
          data: { fundingSubmissionLineJson: typeof worksheet }
        }>()
        vi.mocked(httpClient, true).patch.mockReturnValue(save.promise)
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11 },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        const inputs = wrapper.findAll<HTMLInputElement>("tbody input")
        expect(inputs.map((input) => input.element.readOnly)).toEqual([true, true])
      })

      test("when a JSON save fails, retains the edited input for retry", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => ({
            data: { fundingSubmissionLineJson: worksheet },
          }),
        })
        vi.mocked(httpClient, true).patch.mockRejectedValue(
          new ApiOperationError("Worksheet save failed", 422)
        )
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11 },
        })
        await flushPromises()

        // Act
        const estimate = wrapper.get("tbody input")
        await estimate.setValue("0.5")
        await estimate.trigger("change")
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get<HTMLInputElement>("tbody input").element.value).toEqual("0.5")
      })

      test("when a JSON save is challenged, forwards the recovery error", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => ({
            data: { fundingSubmissionLineJson: worksheet },
          }),
        })
        const challenge = new CloudflareChallengeError()
        vi.mocked(httpClient, true).patch.mockRejectedValue(challenge)
        const errorHandler = vi.fn()
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          apiResponseErrorHandling: false,
          props: { fundingSubmissionLineJsonId: 11 },
          global: { config: { errorHandler: (error) => errorHandler(error) } },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(errorHandler.mock.calls).toEqual([[challenge]])
      })

      test("when worksheet JSON fails to load, withholds editing", async () => {
        // Arrange
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => {
            throw new ApiOperationError("Worksheet unavailable", 503)
          },
        })
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11 },
        })

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input")).toEqual([])
      })

      test("when a reload is challenged, forwards the recovery error", async () => {
        // Arrange
        const challenge = new CloudflareChallengeError()
        let isReloading = false
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => {
            if (isReloading) throw challenge
            throw new ApiOperationError("Worksheet unavailable", 503)
          },
        })
        const errorHandler = vi.fn()
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          apiResponseErrorHandling: false,
          props: { fundingSubmissionLineJsonId: 11 },
          global: { config: { errorHandler: (error) => errorHandler(error) } },
        })
        await flushPromises()

        // Act
        isReloading = true
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(errorHandler.mock.calls).toEqual([[challenge]])
      })

      test("when worksheet JSON recovers, reloading restores editing", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
          lines: [
            {
              submissionLineId: 1,
              sectionName: "Other Funding",
              lineName: "Supplement",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0.0000",
              actualComputedTotal: "0.0000",
            },
          ],
        })
        let isFailing = true
        mockHttpGetRoutes({
          "/api/funding-submission-line-jsons/11": async () => {
            if (isFailing) throw new ApiOperationError("Worksheet unavailable", 503)
            return { data: { fundingSubmissionLineJson: worksheet } }
          },
        })
        const wrapper = mountWithDefaultPlugins(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11 },
        })
        await flushPromises()

        // Act
        isFailing = false
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody tr > td:first-child").text()).toEqual("Supplement")
      })
    })
  })
})
