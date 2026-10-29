import { defineComponent, ref } from "vue"
import { mount } from "@vue/test-utils"

import { mockVuetify } from "@/tests/support"

import NumberTextField from "@/components/common/NumberTextField.vue"

describe("web/src/components/common/NumberTextField.vue", () => {
  describe("NumberTextField", () => {
    describe("numeric editing", () => {
      test.each([
        {
          condition: "a populated input is cleared",
          initialValue: 5,
          enteredValue: "",
          expectedValue: "null",
        },
        {
          condition: "zero is entered into an empty input",
          initialValue: null,
          enteredValue: "0",
          expectedValue: "number:0",
        },
      ])(
        "when $condition, updates the parent with $expectedValue",
        async ({ initialValue, enteredValue, expectedValue }) => {
          // Arrange
          const Parent = defineComponent({
            components: { NumberTextField },
            setup() {
              const value = ref<number | null>(initialValue)
              return { value }
            },
            template: `
            <div>
              <NumberTextField v-model="value" />
              <output>{{ value === null ? "null" : typeof value + ":" + value }}</output>
            </div>
          `,
          })
          const wrapper = mount(Parent, {
            global: { plugins: [mockVuetify()] },
          })

          // Act
          await wrapper.get("input").setValue(enteredValue)

          // Assert
          expect(wrapper.get("output").text()).toBe(expectedValue)
        }
      )
    })
  })
})
