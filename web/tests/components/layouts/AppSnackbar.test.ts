import { mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"

import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

import { mockVuetify } from "@/tests/support"

import AppSnackbar from "@/components/layouts/AppSnackbar.vue"
import { useSnack } from "@/use/use-snack"

describe("web/src/components/layouts/AppSnackbar.vue", () => {
  describe("AppSnackbar", () => {
    describe("API response recovery", () => {
      beforeEach(() => {
        const snack = useSnack()
        snack.reset()
        vi.stubGlobal("visualViewport", undefined)
      })

      test("when response recovery is presented, excludes request secrets", async () => {
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
        const snack = useSnack()

        // Act
        snack.error(apiError.message, { timeout: -1 })
        snack.apiResponseError.value = apiError
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("POST /api/workbook")
        expect(wrapper.text()).toContain("502")
        expect(wrapper.text()).toContain("ray-123")
        expect(wrapper.text()).not.toContain("secret")
      })

      test("when a challenge is presented, offers verification and explicit reload", async () => {
        // Arrange
        const wrapper = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        const apiError = new UnexpectedApiResponseError(
          { method: "post", url: "/api/workbook" },
          403,
          new AxiosHeaders(),
          true
        )
        const snack = useSnack()

        // Act
        snack.error(apiError.message, { timeout: -1 })
        snack.apiResponseError.value = apiError
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("Verify in a normal browser")
        expect(wrapper.findAll("button").map((button) => button.text())).toEqual([
          "Keep Editing",
          "Reload App",
        ])
      })

      test("when a normal notification arrives during recovery, shows the notification", async () => {
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
        snack.error(apiError.message, { timeout: -1 })
        snack.apiResponseError.value = apiError
        await wrapper.vm.$nextTick()

        // Act
        snack.success("Saved")
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.text()).toContain("Saved")
      })

      test("when reload is cancelled, retains the recovery state", async () => {
        // Arrange
        vi.spyOn(window, "confirm").mockReturnValue(false)
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
        const snack = useSnack()
        snack.error(apiError.message, { timeout: -1 })
        snack.apiResponseError.value = apiError
        await wrapper.vm.$nextTick()
        const reloadButton = wrapper
          .findAll("button")
          .find((button) => button.text() === "Reload App")
        if (reloadButton === undefined) throw new Error("Reload App button was not rendered")

        // Act
        await reloadButton.trigger("click")

        // Assert
        expect(snack.apiResponseError.value).toBe(apiError)
      })
    })
  })
})
