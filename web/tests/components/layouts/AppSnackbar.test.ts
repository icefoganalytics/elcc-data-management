import { mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"
import { vi } from "vitest"

import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

import { mockVuetify } from "@/tests/support"

import AppSnackbar from "@/components/layouts/AppSnackbar.vue"
import { useSnack } from "@/use/use-snack"

describe("web/src/components/layouts/AppSnackbar.vue", () => {
  describe("AppSnackbar", () => {
    describe("API response recovery", () => {
      beforeEach(() => {
        useSnack().reset()
        vi.stubGlobal("visualViewport", undefined)
      })

      test("when a server response is unavailable, shows the safe failure summary", async () => {
        // Arrange
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        const apiError = new UnexpectedApiResponseError(
          { method: "post", url: "/api/workbook?secret=hidden" },
          502,
          new AxiosHeaders({ "cf-ray": "ray-123" })
        )

        // Act
        useSnack().error("The write failed", { cause: apiError })
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("The server response was unavailable")
        expect(wrapper.text()).not.toContain("The write failed")
        expect(wrapper.text()).not.toContain("secret")
      })

      test("when recovery metadata is available, shows request details", async () => {
        // Arrange
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        const apiError = new UnexpectedApiResponseError(
          { method: "post", url: "/api/workbook?secret=hidden" },
          502,
          new AxiosHeaders({ "cf-ray": "ray-123" })
        )

        // Act
        useSnack().error("The write failed", { cause: apiError })
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("POST /api/workbook")
        expect(wrapper.text()).toContain("502")
        expect(wrapper.text()).toContain("ray-123")
        expect(wrapper.text()).not.toContain("secret")
      })

      test("when a nested aggregate contains an API response error, shows persistent recovery details", async () => {
        // Arrange
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        const apiError = new UnexpectedApiResponseError(
          { method: "post", url: "/api/workbook?secret=hidden" },
          502,
          new AxiosHeaders({ "cf-ray": "ray-123" }),
          true
        )
        const cause = new AggregateError([
          new Error("An ordinary failure"),
          new AggregateError([new Error("Another ordinary failure"), apiError]),
        ])

        // Act
        useSnack().error("The write failed", { cause })
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("The browser verification challenge interrupted")
        expect(wrapper.text()).toContain("POST /api/workbook")
        expect(wrapper.text()).toContain("502")
        expect(wrapper.text()).toContain("ray-123")
        expect(wrapper.text()).not.toContain("secret")
      })

      test("when an aggregate has no API response error, shows normal feedback", async () => {
        // Arrange
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })

        // Act
        useSnack().error("The write failed", {
          cause: new AggregateError([new Error("First failure"), new Error("Second failure")]),
        })
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("The write failed")
        expect(wrapper.text()).not.toContain("The server response was unavailable")
      })

      test("when a normal notification arrives during recovery, preserves the recovery state", async () => {
        // Arrange
        const apiError = new UnexpectedApiResponseError(
          { method: "put", url: "/api/workbook" },
          500,
          new AxiosHeaders()
        )
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        const snack = useSnack()
        snack.error("Interrupted request", { cause: apiError })
        await wrapper.vm.$nextTick()

        // Act
        snack.success("Saved")
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("The server response was unavailable")
        expect(wrapper.text()).not.toContain("Saved")
      })

      test("when reload is cancelled, keeps the app and recovery state open", async () => {
        // Arrange
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        const apiError = new UnexpectedApiResponseError(
          { method: "post", url: "/api/workbook" },
          502,
          new AxiosHeaders(),
          true
        )

        useSnack().error("Interrupted request", { cause: apiError })
        await wrapper.vm.$nextTick()

        // Act
        const buttons = wrapper.findAll("button")
        const reloadButton = buttons.find((button) => button.text().includes("Reload App"))

        if (reloadButton === undefined) {
          throw new Error("Reload App button was not rendered")
        }

        await reloadButton.trigger("click")

        // Assert
        expect(wrapper.text()).toContain("The browser verification challenge interrupted")
        expect(confirm).toHaveBeenCalledWith(
          "Reloading discards unsaved changes in open forms. It does not guarantee that any interrupted write was not applied."
        )
      })
    })
  })
})
