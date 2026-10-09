import { defineComponent, nextTick, ref } from "vue"
import { enableAutoUnmount, mount } from "@vue/test-utils"

import CurrencyInput from "@/components/CurrencyInput.vue"
import { mockVuetify } from "@/tests/support"

enableAutoUnmount(afterEach)

describe("web/src/components/CurrencyInput.vue", () => {
  describe("CurrencyInput", () => {
    test("when entering the DECIMAL(15,4) maximum, commits all four decimal places as a string", async () => {
      // Arrange
      const Parent = defineComponent({
        components: { CurrencyInput },
        setup() {
          const amount = ref("0.0000")
          return { amount }
        },
        template: `
          <div>
            <CurrencyInput v-model="amount" />
            <output>{{ typeof amount }}:{{ amount }}</output>
          </div>
        `,
      })
      const wrapper = mount(Parent, {
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
      expect({
        amount: wrapper.get("output").text(),
        display: input.element.value,
      }).toEqual({
        amount: "string:99999999999.9999",
        display: "$99,999,999,999.9999",
      })
    })

    test("when pasting a formatted amount, commits an unformatted four-decimal string", async () => {
      // Arrange
      const Parent = defineComponent({
        components: { CurrencyInput },
        setup() {
          const amount = ref("0.0000")
          return { amount }
        },
        template: `
          <div>
            <CurrencyInput v-model="amount" />
            <output>{{ typeof amount }}:{{ amount }}</output>
          </div>
        `,
      })
      const wrapper = mount(Parent, {
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
      expect({
        amount: wrapper.get("output").text(),
        display: inputElement.value,
      }).toEqual({
        amount: "string:1234.5678",
        display: "$1,234.5678",
      })
    })

    test("when committing with Enter, passes the four-decimal string to the parent", async () => {
      // Arrange
      const Parent = defineComponent({
        components: { CurrencyInput },
        setup() {
          const amount = ref("0.0000")
          return { amount }
        },
        template: `
          <div>
            <CurrencyInput v-model="amount" />
            <output>{{ typeof amount }}:{{ amount }}</output>
          </div>
        `,
      })
      const wrapper = mount(Parent, {
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
      const Parent = defineComponent({
        components: { CurrencyInput },
        setup() {
          const amount = ref("100.0001")
          return { amount }
        },
        template: `
          <div>
            <CurrencyInput v-model="amount" />
            <output>{{ typeof amount }}:{{ amount }}</output>
          </div>
        `,
      })
      const wrapper = mount(Parent, {
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
      expect({
        amount: wrapper.get("output").text(),
        display: input.element.value,
      }).toEqual({
        amount: "string:100.0001",
        display: "$100.0001",
      })
    })
  })
})
