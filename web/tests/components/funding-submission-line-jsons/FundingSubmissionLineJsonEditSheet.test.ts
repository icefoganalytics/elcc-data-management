import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"

import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import { mockRouter, mockVuetify } from "@/tests/support"
import { childCareSpaceFactory, fundingSubmissionLineJsonFactory } from "@/tests/factories"

import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"

describe("web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue", () => {
  describe("FundingSubmissionLineJsonEditSheet", () => {
    describe("worksheet editing", () => {
      test("when a renamed Spaces category occupancy changes, recalculates its displayed totals", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
        const space = childCareSpaceFactory.build({
          id: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 9,
          lineName: "Renamed Infant Cohort",
          monthlyAmount: "100.0000",
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
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
        const totals = wrapper.findAll("tfoot td:nth-child(4), tfoot td:nth-child(6)")
        expect(totals.map((cell) => cell.text())).toEqual(["$50", "$25"])
      })

      test("when a Spaces save is pending, keeps occupancy inputs read only", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
        const space = childCareSpaceFactory.build({ id: 1 })
        const save = Promise.withResolvers<{ data: { childCareSpace: typeof space } }>()
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/1") return save.promise
          return { data: { fundingSubmissionLineJson: worksheet } }
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
        expect(lockedInputs.map((input) => input.element.value)).toEqual(["0.5", "0"])
      })

      test("when one Spaces save fails while another is pending, waits before unlocking", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
        const space1 = childCareSpaceFactory.build({ id: 1, categoryId: 9 })
        const space2 = childCareSpaceFactory.build({ id: 2, categoryId: 10 })
        const pendingSave = Promise.withResolvers<{ data: { childCareSpace: typeof space2 } }>()
        const pendingStarted = Promise.withResolvers<void>()
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space1, space2], totalCount: 2 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/1") throw new Error("First Spaces save failed")
          if (url === "/api/child-care-spaces/2") {
            pendingStarted.resolve()
            return pendingSave.promise
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const inputs = wrapper.findAll("tbody input")
        await inputs[0].setValue("0.5")
        await inputs[0].trigger("change")
        await inputs[2].setValue("0.75")
        await inputs[2].trigger("change")

        // Act
        await wrapper.get("button").trigger("click")
        await pendingStarted.promise
        await flushPromises()

        // Assert
        const lockedInputs = wrapper.findAll<HTMLInputElement>("tbody input[readonly]")
        expect(lockedInputs.map((input) => input.element.value)).toEqual(["0.5", "0", "0.75", "0"])
      })

      test("when a parallel Spaces save is challenged, forwards the original error after writes settle", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
        const space1 = childCareSpaceFactory.build({ id: 1, categoryId: 9 })
        const space2 = childCareSpaceFactory.build({ id: 2, categoryId: 10 })
        const challenge = new CloudflareChallengeError({
          config: {
            method: "patch",
            url: "/api/child-care-spaces/1",
            headers: new AxiosHeaders(),
          },
          data: "<html>Browser verification</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge" }),
          status: 200,
          statusText: "OK",
        })
        const pendingSave = Promise.withResolvers<{ data: { childCareSpace: typeof space2 } }>()
        const pendingStarted = Promise.withResolvers<void>()
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space1, space2], totalCount: 2 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/1") throw challenge
          if (url === "/api/child-care-spaces/2") {
            pendingStarted.resolve()
            return pendingSave.promise
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const errorHandler = vi.fn()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: {
            config: { errorHandler },
            plugins: [router, createPinia(), mockVuetify()],
          },
        })
        await flushPromises()
        const inputs = wrapper.findAll("tbody input")
        await inputs[0].setValue("0.5")
        await inputs[0].trigger("change")
        await inputs[2].setValue("0.75")
        await inputs[2].trigger("change")

        // Act
        await wrapper.get("button").trigger("click")
        await pendingStarted.promise
        pendingSave.resolve({ data: { childCareSpace: space2 } })
        await flushPromises()

        // Assert
        expect(errorHandler.mock.calls[0]?.[0]).toBe(challenge)
      })

      test("when a Spaces save fails, does not save dependent worksheet JSON", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
        const space = childCareSpaceFactory.build({ id: 1 })
        const saveJson = vi
          .fn()
          .mockResolvedValue({ data: { fundingSubmissionLineJson: worksheet } })
        const http = vi.mocked(httpClient, true)
        http.get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            return { data: { childCareSpaces: [space], totalCount: 1 } }
          }
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        http.patch.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces/1")
            throw new ApiOperationError("Spaces save failed", 422)
          return saveJson()
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
        expect(saveJson).not.toHaveBeenCalled()
      })

      test.each(["/api/child-care-spaces", "/api/funding-submission-line-jsons/11"])(
        "when %s fails to load, withholds dependent occupancy inputs",
        async (failedUrl) => {
          // Arrange
          const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
          const space = childCareSpaceFactory.build({ id: 1 })
          vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
            if (url === failedUrl) throw new Error("Worksheet source unavailable")
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [space], totalCount: 1 } }
            }
            return { data: { fundingSubmissionLineJson: worksheet } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const errorHandler = vi.fn()
          const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
            props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
            global: {
              config: { errorHandler },
              plugins: [router, createPinia(), mockVuetify()],
            },
          })

          // Act
          await flushPromises()

          // Assert
          expect(wrapper.findAll("tbody input")).toEqual([])
        }
      )

      test("when a reload challenge follows an expected sibling failure, forwards the original challenge", async () => {
        // Arrange
        const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
        const pendingWorksheet = Promise.withResolvers<{
          data: { fundingSubmissionLineJson: typeof worksheet }
        }>()
        const challenge = new CloudflareChallengeError()
        let isReloading = false
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/child-care-spaces") {
            throw new ApiOperationError("Spaces unavailable", 503)
          }
          if (isReloading) return pendingWorksheet.promise
          return { data: { fundingSubmissionLineJson: worksheet } }
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const errorHandler = vi.fn()
        const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
          props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
          global: {
            config: { errorHandler },
            plugins: [router, createPinia(), mockVuetify()],
          },
        })
        await flushPromises()
        const reload = wrapper
          .findAll("button")
          .find((button) => button.text() === "Reload Worksheet")
        if (!reload) throw new Error("Expected Reload Worksheet")

        // Act
        isReloading = true
        await reload.trigger("click")
        await flushPromises()
        pendingWorksheet.reject(challenge)
        await flushPromises()

        // Assert
        expect(errorHandler.mock.calls[0]?.[0]).toBe(challenge)
      })

      test.each(["/api/child-care-spaces", "/api/funding-submission-line-jsons/11"])(
        "when %s recovers and the worksheet is reloaded, restores Spaces editing",
        async (failedUrl) => {
          // Arrange
          const worksheet = fundingSubmissionLineJsonFactory.build({ id: 11, centreId: 1 })
          const space = childCareSpaceFactory.build({ id: 1, lineName: "Renamed Infant Cohort" })
          let failing = true
          vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
            if (failing && url === failedUrl) throw new Error("Worksheet source unavailable")
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [space], totalCount: 1 } }
            }
            return { data: { fundingSubmissionLineJson: worksheet } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const errorHandler = vi.fn()
          const wrapper = mount(FundingSubmissionLineJsonEditSheet, {
            props: { fundingSubmissionLineJsonId: 11, centreId: 1, fiscalPeriodId: 1 },
            global: {
              config: { errorHandler },
              plugins: [router, createPinia(), mockVuetify()],
            },
          })
          await flushPromises()
          const reload = wrapper
            .findAll("button")
            .find((button) => button.text() === "Reload Worksheet")
          if (!reload) throw new Error("Expected Reload Worksheet")

          // Act
          failing = false
          await reload.trigger("click")
          await flushPromises()

          // Assert
          expect(wrapper.findAll("tbody tr > td:first-child").map((cell) => cell.text())).toEqual([
            "Renamed Infant Cohort",
          ])
        }
      )
    })
  })
})
