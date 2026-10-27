import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { mockRouter, mockVuetify } from "@/tests/support"
import {
  childCareSpaceFactory,
  fundingSubmissionLineJsonFactory,
  qualityEnhancementFactory,
} from "@/tests/factories"

import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"

describe("web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue", () => {
  describe("FundingSubmissionLineJsonEditSheet", () => {
    describe("worksheet editing", () => {
      test("when a renamed category's occupancy changes, renders the ledger and linked section totals", async () => {
        // Arrange
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
        })
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 3,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 12,
          childCareSpaceCategoryId: 9,
          lineName: "Infants",
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const [estimateInput, actualInput] = wrapper.findAll("tbody input")

        // Act
        await estimateInput.setValue("0.5")
        await estimateInput.trigger("change")
        await actualInput.setValue("0.25")
        await actualInput.trigger("change")

        // Assert
        const renderedTotals = wrapper.findAll("tfoot td:nth-child(4), tfoot td:nth-child(6)")
        expect(renderedTotals.map((cell) => cell.text())).toEqual([
          "$50.00",
          "$25.00",
          "$5.00",
          "$2.50",
          "$10.00",
          "$5.00",
        ])
      })

      test("when a ledger save is pending, keeps every occupancy input read only", async () => {
        // Arrange
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
        })
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 3,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 12,
          childCareSpaceCategoryId: 9,
          lineName: "Infants",
        })
        const ledgerUpdate = Promise.withResolvers<{
          data: { childCareSpace: typeof childCareSpace }
        }>()
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        httpClientMock.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/1") {
            return ledgerUpdate.promise
          }

          return { data: { fundingSubmissionLineJson } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const estimateInput = wrapper.get("tbody input")
        await estimateInput.setValue("0.5")
        await estimateInput.trigger("change")

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        const lockedInputs = wrapper.findAll<HTMLInputElement>("tbody input[readonly]")
        expect(lockedInputs.map((input) => input.element.value)).toEqual([
          "0.5",
          "0.0000",
          "0.5",
          "0.0000",
          "0.5",
          "0.0000",
        ])
      })

      test("when one ledger update fails and another is pending, waits before unlocking", async () => {
        // Arrange
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
        })
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 3,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 12,
          childCareSpaceCategoryId: 9,
          lineName: "Infants",
        })
        const secondChildCareSpace = childCareSpaceFactory.build({
          id: 2,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 10,
          lineName: "Toddler Cohort",
        })
        const pendingLedgerUpdate = Promise.withResolvers<{
          data: { childCareSpace: typeof childCareSpace }
        }>()
        const pendingLedgerUpdateStarted = Promise.withResolvers<void>()
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return {
              data: {
                childCareSpaces: [childCareSpace, secondChildCareSpace],
                totalCount: 2,
              },
            }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        httpClientMock.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/1") {
            throw new Error("First ledger update failed")
          }
          if (url === "/api/child-care-spaces/2") {
            pendingLedgerUpdateStarted.resolve()
            return pendingLedgerUpdate.promise
          }

          return { data: { fundingSubmissionLineJson } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const occupancyInputs = wrapper.findAll<HTMLInputElement>("tbody input")
        await occupancyInputs[0].setValue("0.5")
        await occupancyInputs[2].setValue("0.5")
        await occupancyInputs[0].trigger("change")
        await occupancyInputs[2].trigger("change")

        // Act
        await wrapper
          .findAll("button")
          .find((button) => button.text() === "Save")
          ?.trigger("click")
        await pendingLedgerUpdateStarted.promise
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input[readonly]")).toHaveLength(8)
        expect(
          httpClientMock.patch.mock.calls.some(
            ([url]) => url === "/api/funding-submission-line-jsons/11"
          )
        ).toBe(false)
      })

      test("when estimate replication is pending, keeps every occupancy input read only", async () => {
        // Arrange
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
        })
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 3,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 12,
          childCareSpaceCategoryId: 9,
          lineName: "Infants",
        })
        const replication = Promise.withResolvers<{ data: undefined }>()
        const replicationStarted = Promise.withResolvers<void>()
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        httpClientMock.patch.mockResolvedValue({ data: { fundingSubmissionLineJson } })
        httpClientMock.post.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons/11/replicate-estimates") {
            replicationStarted.resolve()
            return replication.promise
          }

          return { data: undefined }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const replicateButton = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicateButton) throw new Error("Replicate Estimates button is missing")

        // Act
        await replicateButton.trigger("click")
        await replicationStarted.promise
        await flushPromises()

        // Assert
        const lockedInputs = wrapper.findAll<HTMLInputElement>("tbody input[readonly]")
        expect(lockedInputs.map((input) => input.element.value)).toEqual([
          "0.0000",
          "0.0000",
          "0.0000",
          "0.0000",
          "0.0000",
          "0.0000",
        ])
      })

      test("when estimate replication fails while a sibling is pending, keeps inputs read only", async () => {
        // Arrange
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
        })
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 3,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 12,
          childCareSpaceCategoryId: 9,
          lineName: "Infants",
        })
        const childSpaceReplication = Promise.withResolvers<{ data: undefined }>()
        const childSpaceReplicationStarted = Promise.withResolvers<void>()
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        httpClientMock.patch.mockResolvedValue({ data: { fundingSubmissionLineJson } })
        httpClientMock.post.mockImplementation(async (url) => {
          if (url === "/api/funding-submission-line-jsons/11/replicate-estimates") {
            throw new Error("Funding submission replication failed")
          }
          if (url === "/api/child-care-spaces/1/replicate-estimates") {
            childSpaceReplicationStarted.resolve()
            return childSpaceReplication.promise
          }
          if (url === "/api/quality-enhancements/3/replicate-estimates") {
            return { data: undefined }
          }

          throw new Error(`Unexpected POST ${url}`)
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const replicateButton = wrapper
          .findAll("button")
          .find((button) => button.text().includes("Replicate Estimates"))
        if (!replicateButton) throw new Error("Replicate Estimates button is missing")

        // Act
        await replicateButton.trigger("click")
        await childSpaceReplicationStarted.promise
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input[readonly]")).toHaveLength(6)
      })

      test.each([
        "/api/child-care-spaces",
        "/api/quality-enhancements",
        "/api/funding-submission-line-jsons/11",
      ])("when %s fails to load, withholds all occupancy inputs", async (failedUrl) => {
        // Arrange
        const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
          id: 11,
          centreId: 1,
        })
        const childCareSpace = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
        })
        const qualityEnhancement = qualityEnhancementFactory.build({
          id: 3,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 12,
          childCareSpaceCategoryId: 9,
          lineName: "Infants",
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === failedUrl) throw new Error("Worksheet source unavailable")

          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
          }
          if (url === "/api/quality-enhancements") {
            return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
          }

          return { data: { fundingSubmissionLineJson } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody input")).toEqual([])
      })

      test.each([
        "/api/child-care-spaces",
        "/api/quality-enhancements",
        "/api/funding-submission-line-jsons/11",
      ])(
        "when %s recovers and the worksheet is reloaded, restores the ledger and linked rows",
        async (failedUrl) => {
          // Arrange
          const fundingSubmissionLineJson = fundingSubmissionLineJsonFactory.build({
            id: 11,
            centreId: 1,
          })
          const childCareSpace = childCareSpaceFactory.build({
            id: 1,
            centreId: 1,
            fiscalPeriodId: 1,
            categoryId: 9,
            lineName: "Renamed Infant Cohort",
          })
          const qualityEnhancement = qualityEnhancementFactory.build({
            id: 3,
            centreId: 1,
            fiscalPeriodId: 1,
            categoryId: 12,
            childCareSpaceCategoryId: 9,
            lineName: "Infants",
          })
          let isRequestFailing = true
          vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
            if (isRequestFailing && url === failedUrl)
              throw new Error("Worksheet source unavailable")

            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [childCareSpace], totalCount: 1 } }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [qualityEnhancement], totalCount: 1 } }
            }

            return { data: { fundingSubmissionLineJson } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
            props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
            global: { plugins: [router, createPinia(), mockVuetify()] },
          })
          await flushPromises()

          // Act
          isRequestFailing = false
          await wrapper.get("button").trigger("click")
          await flushPromises()

          // Assert
          const renderedLines = wrapper.findAll("tbody tr > td:first-child")
          expect(renderedLines.map((cell) => cell.text())).toEqual([
            "Renamed Infant Cohort",
            "Infants",
            "Infants",
          ])
        }
      )
    })
  })
})
