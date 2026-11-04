import { AxiosHeaders } from "axios"
import { DOMWrapper, flushPromises, mount } from "@vue/test-utils"
import { isUndefined } from "lodash"
import { defineComponent, h } from "vue"

import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import apiResponseErrorPlugin from "@/plugins/api-response-error-plugin"
import useCloudflareChallenge from "@/use/use-cloudflare-challenge"
import { mockRouter, mockVuetify } from "@/tests/support"

import CloudflareChallengeDialog from "@/components/CloudflareChallengeDialog.vue"

describe("web/src/components/CloudflareChallengeDialog.vue", () => {
  describe("CloudflareChallengeDialog", () => {
    describe("challenge recovery", () => {
      beforeEach(() => {
        vi.stubGlobal("visualViewport", undefined)
      })

      afterEach(async () => {
        useCloudflareChallenge().reset()
        await flushPromises()
      })

      test("when a real challenge arrives, preserves the full route while adding recovery visibility", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=false#details")
        await router.isReady()
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })
        const dialogOpened = Promise.withResolvers<void>()
        const stopNavigationWatch = router.afterEach((route) => {
          if (route.query.showCloudflareChallenge === "true") {
            dialogOpened.resolve()
          }
        })

        // Act
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        await flushPromises()
        await dialogOpened.promise
        stopNavigationWatch()

        // Assert
        expect(router.currentRoute.value.fullPath).toBe(
          "/workflows/7?filter=mine&showCloudflareChallenge=true#details"
        )
      })

      test("when a real challenge arrives, shows browser verification", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine#details")
        await router.isReady()
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get("#api-response-error-title").isVisible()).toBe(
          true
        )
      })

      test("when visibility is in the URL without a captured challenge, removes only the stale visibility flag", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=true#details")
        await router.isReady()
        const staleFlagCleared = Promise.withResolvers<void>()
        const stopNavigationWatch = router.afterEach((route) => {
          if (isUndefined(route.query.showCloudflareChallenge)) {
            staleFlagCleared.resolve()
          }
        })
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        await flushPromises()
        await staleFlagCleared.promise
        stopNavigationWatch()

        // Assert
        expect(router.currentRoute.value.fullPath).toBe("/workflows/7?filter=mine#details")
      })

      test("when visibility is in the URL without a captured challenge, keeps recovery hidden", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=true#details")
        await router.isReady()
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        await flushPromises()

        // Assert
        const recoveryTitles = new DOMWrapper(document.body).findAll("#api-response-error-title")
        expect(recoveryTitles.some((title) => title.isVisible())).toBe(false)
      })

      test("when a loaded page clears its challenge, preserves its unsaved mounted input", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=true#details")
        await router.isReady()
        const formPage = defineComponent({
          render: () =>
            h("main", [
              h("input", { "aria-label": "Unsaved title" }),
              h(CloudflareChallengeDialog),
            ]),
        })
        const wrapper = mount(formPage, {
          global: { plugins: [mockVuetify(), router] },
        })
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        await flushPromises()
        await wrapper.get("input").setValue("Unsaved edit")
        const dialogClosed = Promise.withResolvers<void>()
        const stopNavigationWatch = router.afterEach((route) => {
          if (isUndefined(route.query.showCloudflareChallenge)) {
            dialogClosed.resolve()
          }
        })

        // Act
        useCloudflareChallenge().reset()
        await flushPromises()
        await dialogClosed.promise
        stopNavigationWatch()

        // Assert
        expect(wrapper.get<HTMLInputElement>("input").element.value).toBe("Unsaved edit")
      })

      test("when a loaded page clears its challenge, restores the original full route", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=true#details")
        await router.isReady()
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })
        await flushPromises()
        const dialogClosed = Promise.withResolvers<void>()
        const stopNavigationWatch = router.afterEach((route) => {
          if (isUndefined(route.query.showCloudflareChallenge)) {
            dialogClosed.resolve()
          }
        })

        // Act
        useCloudflareChallenge().reset()
        await flushPromises()
        await dialogClosed.promise
        stopNavigationWatch()

        // Assert
        expect(router.currentRoute.value.fullPath).toBe("/workflows/7?filter=mine#details")
      })

      test("when a loaded page clears its challenge, hides recovery", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=true#details")
        await router.isReady()
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })
        await flushPromises()

        // Act
        useCloudflareChallenge().reset()
        await flushPromises()

        // Assert
        const recoveryTitles = new DOMWrapper(document.body).findAll("#api-response-error-title")
        expect(recoveryTitles.some((title) => title.isVisible())).toBe(false)
      })

      test("when startup has a challenge before router readiness, preserves the settled full route", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        router.options.history.replace("/workflows/7?filter=mine#details")
        const dialogOpened = Promise.withResolvers<void>()
        const stopNavigationWatch = router.afterEach((route) => {
          if (route.query.showCloudflareChallenge === "true") {
            dialogOpened.resolve()
          }
        })
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        await router.isReady()
        await flushPromises()
        await dialogOpened.promise
        stopNavigationWatch()

        // Assert
        expect(router.currentRoute.value.fullPath).toBe(
          "/workflows/7?filter=mine&showCloudflareChallenge=true#details"
        )
      })

      test("when startup has a challenge before router readiness, shows browser verification", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        router.options.history.replace("/workflows/7?filter=mine#details")
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        await router.isReady()
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get("#api-response-error-title").isVisible()).toBe(
          true
        )
      })

      test("when initial guarded navigation is challenged, offers visible reload recovery", async () => {
        // Arrange
        const router = mockRouter([
          {
            path: "/administration/users",
            name: "UsersPage",
            component: { template: "<div />" },
          },
        ])
        const navigationFailed = Promise.withResolvers<void>()
        router.onError(() => navigationFailed.resolve())
        router.beforeEach(() => {
          const challenge = new CloudflareChallengeError({
            config: { headers: new AxiosHeaders(), url: "/api/current-user", method: "get" },
            data: "",
            headers: new AxiosHeaders({ "cf-mitigated": "challenge" }),
            status: 403,
            statusText: "Forbidden",
          })
          throw challenge
        })
        router.options.history.replace("/administration/users?filter=mine#details")
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        await navigationFailed.promise
        await flushPromises()

        // Assert
        const reloadButton = new DOMWrapper(document.body).get("button")
        expect(reloadButton.isVisible()).toBe(true)
      })

      test("when Auth0 clears the URL before challenged initial authorization, restores the attempted full URL", async () => {
        // Arrange
        const router = mockRouter([
          {
            path: "/administration/users",
            name: "UsersPage",
            component: { template: "<div />" },
          },
        ])
        const navigationFailed = Promise.withResolvers<void>()
        router.onError(() => navigationFailed.resolve())
        router.beforeEach(() => {
          // Auth0 clears its callback URL before restoring the protected destination.
          router.options.history.replace("/")
          throw new CloudflareChallengeError({
            config: { headers: new AxiosHeaders(), url: "/api/current-user", method: "get" },
            data: "",
            headers: new AxiosHeaders({ "cf-mitigated": "challenge" }),
            status: 403,
            statusText: "Forbidden",
          })
        })
        router.options.history.replace("/administration/users?filter=mine#details")
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router, apiResponseErrorPlugin] },
        })

        // Act
        await navigationFailed.promise
        await flushPromises()

        // Assert
        expect(router.options.history.location).toBe("/administration/users?filter=mine#details")
      })

      test("when recovery is reset after initial navigation fails, hides the recovery control", async () => {
        // Arrange
        const router = mockRouter([
          {
            path: "/administration/users",
            name: "UsersPage",
            component: { template: "<div />" },
          },
        ])
        const navigationFailed = Promise.withResolvers<void>()
        router.onError(() => navigationFailed.resolve())
        router.beforeEach(() => {
          throw new CloudflareChallengeError({
            config: { headers: new AxiosHeaders(), url: "/api/current-user", method: "get" },
            data: "",
            headers: new AxiosHeaders({ "cf-mitigated": "challenge" }),
            status: 403,
            statusText: "Forbidden",
          })
        })
        router.options.history.replace("/administration/users?filter=mine#details")
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })
        await navigationFailed.promise
        await flushPromises()

        // Act
        useCloudflareChallenge().reset()
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get("button").isVisible()).toBe(false)
      })

      test("when a challenge is visible, offers reload without a keep-working action", async () => {
        // Arrange
        const router = mockRouter([
          { path: "/workflows/:id", name: "WorkflowPage", component: { template: "<div />" } },
        ])
        await router.push("/workflows/7?filter=mine&showCloudflareChallenge=true#details")
        await router.isReady()
        useCloudflareChallenge().error.value = new CloudflareChallengeError({
          config: { headers: new AxiosHeaders(), url: "/api/workflows", method: "post" },
          data: "<html>Private challenge response</html>",
          headers: new AxiosHeaders({ "cf-mitigated": "challenge", "cf-ray": "test-ray" }),
          status: 403,
          statusText: "Forbidden",
        })
        mount(CloudflareChallengeDialog, {
          global: { plugins: [mockVuetify(), router] },
        })

        // Act
        await flushPromises()

        // Assert
        const actions = Array.from(
          document.body.querySelectorAll('[role="dialog"] .v-card-actions button')
        ).map((button) => button.textContent?.trim())
        expect(actions).toEqual(["Reload and verify"])
      })
    })
  })
})
