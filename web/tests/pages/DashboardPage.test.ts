import { flushPromises, mount } from "@vue/test-utils"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import httpClient from "@/api/http-client"
import useSnack from "@/use/use-snack"

import { mockRouter, mockVuetify } from "@/tests/support"

import DashboardPage from "@/pages/DashboardPage.vue"

describe("web/src/pages/DashboardPage.vue", () => {
  describe("DashboardPage", () => {
    describe("centre statistics", () => {
      test("when the request is pending, shows loading instead of a zero count", async () => {
        // Arrange
        const pending = Promise.withResolvers<never>()
        vi.mocked(httpClient, true).get.mockReturnValueOnce(pending.promise)
        const router = mockRouter([
          { path: "/", name: "DashboardPage", component: { template: "<div />" } },
          { path: "/centres", name: "ChildCareCentresPage", component: { template: "<div />" } },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(DashboardPage, {
          global: {
            plugins: [router, mockVuetify()],
            stubs: { apexchart: true },
          },
        })

        // Assert
        expect(wrapper.get('[aria-label="Child care centre count"]').text()).toEqual("Loading…")
      })

      test("when no authorized centres exist, displays the real zero count", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0 },
        })
        const router = mockRouter([
          { path: "/", name: "DashboardPage", component: { template: "<div />" } },
          { path: "/centres", name: "ChildCareCentresPage", component: { template: "<div />" } },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(DashboardPage, {
          global: {
            plugins: [router, mockVuetify()],
            stubs: { apexchart: true },
          },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get('[aria-label="Child care centre count"]').text()).toEqual("0")
      })

      test("when statistics cannot be loaded, displays unavailable rather than zero", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockRejectedValueOnce(
          new ApiOperationError("Unavailable", 503)
        )
        const router = mockRouter([
          { path: "/", name: "DashboardPage", component: { template: "<div />" } },
          { path: "/centres", name: "ChildCareCentresPage", component: { template: "<div />" } },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(DashboardPage, {
          global: {
            plugins: [router, mockVuetify()],
            stubs: { apexchart: true },
          },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get('[aria-label="Community count"]').text()).toEqual("Unavailable")
      })

      test("when loading fails with an operation error, presents shared error feedback", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockRejectedValueOnce(
          new ApiOperationError("Unavailable", 503)
        )
        const snack = useSnack()
        snack.reset()
        const router = mockRouter([
          { path: "/", name: "DashboardPage", component: { template: "<div />" } },
          { path: "/centres", name: "ChildCareCentresPage", component: { template: "<div />" } },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        mount(DashboardPage, {
          global: {
            plugins: [router, mockVuetify()],
            stubs: { apexchart: true },
          },
        })
        await flushPromises()

        // Assert
        expect(snack.message.value).toEqual("Failed to load centre statistics.")
      })

      test("when authentication is required, forwards the original error to application recovery", async () => {
        // Arrange
        const error = new AuthenticationRequiredError()
        vi.mocked(httpClient, true).get.mockRejectedValueOnce(error)
        const errors: unknown[] = []
        const router = mockRouter([
          { path: "/", name: "DashboardPage", component: { template: "<div />" } },
          { path: "/centres", name: "ChildCareCentresPage", component: { template: "<div />" } },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        mount(DashboardPage, {
          global: {
            plugins: [router, mockVuetify()],
            stubs: { apexchart: true },
            config: { errorHandler: (receivedError) => errors.push(receivedError) },
          },
        })
        await flushPromises()

        // Assert
        expect(errors).toEqual([error])
      })

      test("when the page is disposed during a request, does not display cancellation feedback", async () => {
        // Arrange
        const pending = Promise.withResolvers<never>()
        vi.mocked(httpClient, true).get.mockReturnValueOnce(pending.promise)
        const snack = useSnack()
        snack.reset()
        const router = mockRouter([
          { path: "/", name: "DashboardPage", component: { template: "<div />" } },
          { path: "/centres", name: "ChildCareCentresPage", component: { template: "<div />" } },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(DashboardPage, {
          global: {
            plugins: [router, mockVuetify()],
            stubs: { apexchart: true },
          },
        })

        // Act
        wrapper.unmount()
        pending.reject(new ApiOperationError("Late failure", 503))
        await flushPromises()

        // Assert
        expect(snack.message.value).toEqual("")
      })
    })
  })
})
