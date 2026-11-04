import { mount } from "@vue/test-utils"

import CloudflareResponsePreview from "@/components/CloudflareResponsePreview.vue"
import { mockVuetify } from "@/tests/support"

describe("web/src/components/CloudflareResponsePreview.vue", () => {
  describe("CloudflareResponsePreview", () => {
    describe("preview consent", () => {
      test("when unacknowledged, and reveal is requested, keeps response markup unmounted", async () => {
        // Arrange
        const wrapper = mount(CloudflareResponsePreview, {
          props: {
            html: "<p>Private response marker</p>",
          },
          global: { plugins: [mockVuetify()] },
        })
        const revealButton = wrapper.get<HTMLButtonElement>("button")

        // Act
        await revealButton.trigger("click")

        // Assert
        expect(wrapper.find("iframe").exists()).toBe(false)
      })

      test("when acknowledged without reveal, keeps response markup unmounted", async () => {
        // Arrange
        const wrapper = mount(CloudflareResponsePreview, {
          props: {
            html: "<p>Unrevealed response marker</p>",
          },
          global: { plugins: [mockVuetify()] },
        })

        // Act
        await wrapper.get<HTMLInputElement>("input[type=checkbox]").setValue(true)

        // Assert
        expect(wrapper.find("iframe").exists()).toBe(false)
      })

      test("when acknowledged and revealed, mounts a sandboxed preview beside its persistent warning", async () => {
        // Arrange
        const wrapper = mount(CloudflareResponsePreview, {
          props: {
            html: "<p>Visible response marker</p>",
          },
          global: { plugins: [mockVuetify()] },
        })
        const acknowledgement = wrapper.get<HTMLInputElement>("input[type=checkbox]")
        const revealButton = wrapper.get<HTMLButtonElement>("button")

        // Act
        await acknowledgement.setValue(true)
        await revealButton.trigger("click")

        // Assert
        expect(wrapper.get("iframe").attributes()).toMatchObject({
          sandbox: "",
          referrerpolicy: "no-referrer",
        })
      })

      test("when response html changes, clears acknowledgement and hides the old preview", async () => {
        // Arrange
        const wrapper = mount(CloudflareResponsePreview, {
          props: {
            html: "<p>First response</p>",
          },
          global: { plugins: [mockVuetify()] },
        })
        await wrapper.get<HTMLInputElement>("input[type=checkbox]").setValue(true)
        await wrapper.get<HTMLButtonElement>("button").trigger("click")

        // Act
        await wrapper.setProps({ html: "<p>Updated response</p>" })
        await wrapper.get<HTMLButtonElement>("button").trigger("click")

        // Assert
        expect(wrapper.find("iframe").exists()).toBe(false)
      })

      test("when preview is hidden, opts out and requires acknowledgement again", async () => {
        // Arrange
        const wrapper = mount(CloudflareResponsePreview, {
          props: {
            html: "<p>Response to hide</p>",
          },
          global: { plugins: [mockVuetify()] },
        })
        await wrapper.get<HTMLInputElement>("input[type=checkbox]").setValue(true)
        await wrapper.get<HTMLButtonElement>("button").trigger("click")

        // Act
        await wrapper
          .get<HTMLButtonElement>("button[aria-label='Hide Cloudflare response preview']")
          .trigger("click")
        await wrapper.get<HTMLButtonElement>("button").trigger("click")

        // Assert
        expect(wrapper.find("iframe").exists()).toBe(false)
      })
    })
  })
})
