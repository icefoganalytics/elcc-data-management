import { nextTick } from "vue"
import { mount } from "@vue/test-utils"

import CurrencyInputModel from "@/tests/components/common/CurrencyInputModel.vue"
import { mockVuetify } from "@/tests/support"

describe("web/src/components/CurrencyInput.vue", () => {
  describe("CurrencyInput", () => {
    describe("decimal editing", () => {
      test("when entering the DECIMAL(15,4) maximum, commits all four decimal places as a string", async () => {
        // Arrange
        const wrapper = mount(CurrencyInputModel, {
          props: {
            initialAmount: "0.0000",
          },
          attachTo: document.body,
          global: {
            plugins: [mockVuetify()],
          },
        })
        await nextTick()

        const input = wrapper.get("input")
        vi.useFakeTimers()
        try {
          input.element.focus()
          vi.runOnlyPendingTimers()
        } finally {
          vi.useRealTimers()
        }
        await nextTick()

        // Act
        await input.setValue("99999999999.9999")
        input.element.blur()
        await nextTick()

        // Assert
        expect(wrapper.get("output").text()).toBe("string:99999999999.9999")
      })

      test("when pasting a formatted amount, commits an unformatted four-decimal string", async () => {
        // Arrange
        const wrapper = mount(CurrencyInputModel, {
          props: {
            initialAmount: "0.0000",
          },
          attachTo: document.body,
          global: {
            plugins: [mockVuetify()],
          },
        })
        await nextTick()

        const input = wrapper.get("input")
        vi.useFakeTimers()
        try {
          input.element.focus()
          vi.runOnlyPendingTimers()
        } finally {
          vi.useRealTimers()
        }
        await nextTick()
        const pastedValue = "$1,234.5678"
        const inputElement = input.element

        // Act
        inputElement.value = pastedValue
        inputElement.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            data: pastedValue,
            inputType: "insertFromPaste",
          })
        )
        await nextTick()
        inputElement.blur()
        await nextTick()

        // Assert
        expect(wrapper.get("output").text()).toBe("string:1234.5678")
      })

      test("when committing with Enter, passes the four-decimal string to the parent", async () => {
        // Arrange
        const wrapper = mount(CurrencyInputModel, {
          props: {
            initialAmount: "0.0000",
          },
          attachTo: document.body,
          global: {
            plugins: [mockVuetify()],
          },
        })
        await nextTick()

        const input = wrapper.get("input")
        vi.useFakeTimers()
        try {
          input.element.focus()
          vi.runOnlyPendingTimers()
        } finally {
          vi.useRealTimers()
        }
        await nextTick()

        // Act
        await input.setValue("100.0001")
        await input.trigger("keydown", { key: "Enter" })
        await nextTick()

        // Assert
        expect(wrapper.get("output").text()).toBe("string:100.0001")
      })

      test("when cancelling with Escape, restores the original decimal string", async () => {
        // Arrange
        const wrapper = mount(CurrencyInputModel, {
          props: {
            initialAmount: "100.0001",
          },
          attachTo: document.body,
          global: {
            plugins: [mockVuetify()],
          },
        })
        await nextTick()

        const input = wrapper.get("input")
        vi.useFakeTimers()
        try {
          input.element.focus()
          vi.runOnlyPendingTimers()
        } finally {
          vi.useRealTimers()
        }
        await nextTick()

        // Act
        await input.setValue("200.0002")
        await input.trigger("keydown", { key: "Escape" })
        input.element.blur()
        await nextTick()

        // Assert
        expect(wrapper.get("output").text()).toBe("string:100.0001")
      })
    })
  })
})
