import { defineComponent } from "vue"
import { mount } from "@vue/test-utils"

import CurrencyInput from "@/components/CurrencyInput.vue"

const VTextFieldStub = defineComponent({
  name: "VTextField",
  props: {
    modelValue: String,
    rules: Array,
  },
  emits: ["update:modelValue", "focus", "blur", "keydown"],
  template: "<input />",
})

describe("web/src/components/CurrencyInput.vue", () => {
  describe("CurrencyInput", () => {

    test("when displaying a formatted money value, passes the raw decimal value to its rule", () => {
      // Arrange
      const validateRawDecimal = vi.fn(() => true)
      const wrapper = mount(CurrencyInput, {
        props: {
          modelValue: "150.0000",
          rules: [validateRawDecimal],
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
      expect(validateRawDecimal).toHaveBeenCalledWith("150.0000")
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

    test("when focusing and blurring without an edit, does not emit", async () => {
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
      await currencyInput.vm.$emit("blur")

      // Assert
      expect(wrapper.emitted("update:modelValue")).toBeUndefined()
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
      await currencyInput.vm.$emit("keydown", new KeyboardEvent("keydown", { key: "Enter" }))
      await currencyInput.vm.$emit("update:modelValue", "100.0001")

      // Assert
      expect(currencyInput.props("modelValue")).toBe("100.0001")
    })

    test("when cancelling with Escape, restores the original decimal then allows a new value", async () => {
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
      await currencyInput.vm.$emit("keydown", new KeyboardEvent("keydown", { key: "Escape" }))
      const inputValueAfterEscape = currencyInput.props("modelValue")
      await currencyInput.vm.$emit("update:modelValue", "100.0001")
      await currencyInput.vm.$emit("blur")

      // Assert
      expect({
        inputValueAfterEscape,
        emitted: wrapper.emitted("update:modelValue"),
      }).toEqual({
        inputValueAfterEscape: "100.0000",
        emitted: [["100.0001"]],
      })
    })

    test("when committing with Enter then blurring, emits the decimal once", async () => {
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
      await currencyInput.vm.$emit("keydown", new KeyboardEvent("keydown", { key: "Enter" }))
      await currencyInput.vm.$emit("blur")

      // Assert
      expect(wrapper.emitted("update:modelValue")).toEqual([["100.0000"]])
    })

    test("when cancelling with Escape then blurring, does not emit", async () => {
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
      await currencyInput.vm.$emit("keydown", new KeyboardEvent("keydown", { key: "Escape" }))
      await currencyInput.vm.$emit("blur")

      // Assert
      expect(wrapper.emitted("update:modelValue")).toBeUndefined()
    })
  })
})
