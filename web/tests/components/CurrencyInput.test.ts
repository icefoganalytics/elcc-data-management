import { defineComponent } from "vue"
import { mount } from "@vue/test-utils"

import CurrencyInput from "@/components/CurrencyInput.vue"
import greaterThan from "@/utils/validators/greater-than"

const VTextFieldStub = defineComponent({
  name: "VTextField",
  props: {
    modelValue: String,
    rules: Array,
  },
  emits: ["update:modelValue", "focus", "blur", "keydown.enter", "keydown.escape"],
  template: "<input />",
})

describe("web/src/components/CurrencyInput.vue", () => {
  describe("CurrencyInput", () => {
    test("when displaying a formatted money value, validates the raw decimal value", () => {
      // Arrange
      const validateGreaterThanZero = greaterThan("0")
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "150.0000",
          rules: [validateGreaterThanZero],
        },
        global: {
          stubs: {
            VTextField: VTextFieldStub,
          },
        },
      })
      const currencyInput = wrapper.findComponent(VTextFieldStub)
      const [validate] = currencyInput.props("rules") as Array<() => boolean | string>

      // Act
      const result = validate()

      // Assert
      expect(result).toBe(true)
    })

    test("when displaying a formatted money value, passes the raw decimal value to its rule", () => {
      // Arrange
      const validateGreaterThanZero = vi.fn(greaterThan("0"))
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "150.0000",
          rules: [validateGreaterThanZero],
        },
        global: {
          stubs: {
            VTextField: VTextFieldStub,
          },
        },
      })
      const currencyInput = wrapper.findComponent(VTextFieldStub)
      const [validate] = currencyInput.props("rules") as Array<() => boolean | string>

      // Act
      validate()

      // Assert
      expect(validateGreaterThanZero).toHaveBeenCalledWith("150.0000")
    })

    test("when the decimal value is empty, displays an empty input", () => {
      // Arrange
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "",
        },
        global: {
          stubs: {
            VTextField: VTextFieldStub,
          },
        },
      })

      // Act
      const currencyInput = wrapper.findComponent(VTextFieldStub)

      // Assert
      expect(currencyInput.props("modelValue")).toBe("")
    })

    test("when committing a high-precision decimal, emits the exact decimal string", async () => {
      // Arrange
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "0.0000",
        },
        global: {
          stubs: {
            VTextField: VTextFieldStub,
          },
        },
      })
      const currencyInput = wrapper.findComponent(VTextFieldStub)

      // Act
      await currencyInput.vm.$emit("focus")
      await currencyInput.vm.$emit("update:modelValue", "9007199254740993.0001")
      await currencyInput.vm.$emit("blur")

      // Assert
      expect(wrapper.emitted("update:modelValue")).toEqual([["9007199254740993.0001"]])
    })

    test("when committing with Enter, keeps the raw decimal editable", async () => {
      // Arrange
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "0.0000",
        },
        global: {
          stubs: {
            VTextField: VTextFieldStub,
          },
        },
      })
      const currencyInput = wrapper.findComponent(VTextFieldStub)

      // Act
      await currencyInput.vm.$emit("focus")
      await currencyInput.vm.$emit("update:modelValue", "100")
      await currencyInput.vm.$emit("keydown.enter")
      await currencyInput.vm.$emit("update:modelValue", "100.0001")

      // Assert
      expect(currencyInput.props("modelValue")).toBe("100.0001")
    })

    test("when cancelling with Escape, keeps the original decimal editable", async () => {
      // Arrange
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "100.0000",
        },
        global: {
          stubs: {
            VTextField: VTextFieldStub,
          },
        },
      })
      const currencyInput = wrapper.findComponent(VTextFieldStub)

      // Act
      await currencyInput.vm.$emit("focus")
      await currencyInput.vm.$emit("update:modelValue", "200")
      await currencyInput.vm.$emit("keydown.escape")
      await currencyInput.vm.$emit("update:modelValue", "100.0001")

      // Assert
      expect(currencyInput.props("modelValue")).toBe("100.0001")
    })
  })
})
