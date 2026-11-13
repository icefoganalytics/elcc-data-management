import { DOMWrapper, flushPromises, mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

import apiResponseErrorPlugin from "@/plugins/api-response-error-plugin"

import useCloudflareChallenge from "@/use/use-cloudflare-challenge"

import { mockAuth0, mockRouter, mockVuetify, mountWithDefaultPlugins } from "@/tests/support"

import CloudflareChallengeDialog from "@/components/CloudflareChallengeDialog.vue"

import UniqueTextField from "@/components/common/UniqueTextField.vue"

describe("web/src/components/common/UniqueTextField.vue", () => {
  describe("UniqueTextField", () => {
    describe("uniqueness recovery", () => {
      beforeEach(() => {
        vi.useFakeTimers()
        vi.stubGlobal("visualViewport", undefined)
      })

      afterEach(async () => {
        useCloudflareChallenge().reset()
        await flushPromises()
        vi.useRealTimers()
      })

      test("when a debounced check requires authentication, restores sign-in to the full current route", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/funding-regions/:id/edit", component: { template: "<div />" } },
        ])
        await router.push("/funding-regions/7/edit?filter=mine#name")
        await router.isReady()
        const auth0 = mockAuth0()
        const wrapper = mountWithDefaultPlugins(UniqueTextField, {
          router,
          auth0,
          props: {
            modelValue: "",
            label: "Name",
            checkAvailability: vi.fn().mockRejectedValue(new AuthenticationRequiredError()),
          },
        })

        // Act
        await wrapper.get("input").setValue("New region")
        await vi.advanceTimersByTimeAsync(500)
        await flushPromises()

        // Assert
        expect(auth0.loginWithRedirect).toHaveBeenCalledWith({
          appState: { target: "/funding-regions/7/edit?filter=mine#name" },
        })
      })

      test("when a debounced check is challenged, shows application recovery", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/funding-regions/:id/edit", component: { template: "<div />" } },
        ])
        await router.push("/funding-regions/7/edit")
        await router.isReady()
        const challenge = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/funding-regions", method: "get" },
          data: "<html>Controlled diagnostic</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge" }),
          status: 200,
          statusText: "OK",
        })
        mount(CloudflareChallengeDialog, {
          global: { plugins: [router, mockVuetify()] },
          attachTo: document.body,
        })
        const wrapper = mount(UniqueTextField, {
          props: {
            modelValue: "",
            label: "Name",
            checkAvailability: vi.fn().mockRejectedValue(challenge),
          },
          global: { plugins: [router, mockVuetify(), apiResponseErrorPlugin] },
        })

        // Act
        await wrapper.get("input").setValue("New region")
        await vi.advanceTimersByTimeAsync(500)
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get("#api-response-error-title").isVisible()).toBe(
          true
        )
      })

      test("when validation has an expected operation failure, returns an unsuccessful result locally", async () => {
        // Arrange
        const wrapper = mount(UniqueTextField, {
          props: {
            modelValue: "New region",
            label: "Name",
            checkAvailability: vi.fn().mockRejectedValue(new ApiOperationError("Unavailable", 503)),
          },
          global: { plugins: [mockVuetify()] },
        })

        // Act / Assert
        await expect(wrapper.vm.validate()).resolves.toBe(false)
      })
    })
  })
})
