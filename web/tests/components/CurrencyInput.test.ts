import { defineComponent, nextTick, ref } from "vue"
import { mount, type DOMWrapper, type VueWrapper } from "@vue/test-utils"

import CurrencyInput from "@/components/CurrencyInput.vue"
import { mockVuetify } from "@/tests/support"

type ValidationRule = (value: unknown) => boolean | string

const mountedWrappers: VueWrapper[] = []

afterEach(() => {
  mountedWrappers.forEach((wrapper) => {
    wrapper.unmount()
    wrapper.element.remove()
  })
  mountedWrappers.length = 0
})

describe("web/src/components/CurrencyInput.vue", () => {
  describe("CurrencyInput", () => {
    test("when entering the DECIMAL(15,4) maximum, preserves all four decimal places", async () => {
      // Arrange
      const wrapper = mountParent("0.0000")
      const input = await focusInput(wrapper)

      // Act
      await input.setValue("99999999999.9999")
      await blurInput(wrapper)

      // Assert
      expect({
        amount: wrapper.get("output").text(),
        display: input.element.value,
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        amount: "99999999999.9999",
        display: "$99,999,999,999.9999",
        updates: [["99999999999.9999"]],
      })
    })

    test("when pasting a formatted amount, commits an unformatted four-decimal string", async () => {
      // Arrange
      const wrapper = mountParent("0.0000")
      const input = await focusInput(wrapper)
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
      await blurInput(wrapper)

      // Assert
      expect({
        amount: wrapper.get("output").text(),
        display: inputElement.value,
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        amount: "1234.5678",
        display: "$1,234.5678",
        updates: [["1234.5678"]],
      })
    })

    test("when leaving an unchanged amount, does not commit an update", async () => {
      // Arrange
      const wrapper = mountParent("150.0000")
      const input = await focusInput(wrapper)

      // Act
      await blurInput(wrapper)

      // Assert
      expect({
        amount: wrapper.get("output").text(),
        display: input.element.value,
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        amount: "150.0000",
        display: "$150.0000",
        updates: undefined,
      })
    })

    test("when committing with Enter then blurring, emits the decimal once", async () => {
      // Arrange
      const wrapper = mountParent("0.0000")
      const input = await focusInput(wrapper)

      // Act
      await input.setValue("100.0001")
      await input.trigger("keydown", { key: "Enter" })
      await nextTick()
      await blurInput(wrapper)

      // Assert
      expect({
        amount: wrapper.get("output").text(),
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        amount: "100.0001",
        updates: [["100.0001"]],
      })
    })

    test("when editing again after Enter, commits the subsequent value on blur", async () => {
      // Arrange
      const wrapper = mountParent("0.0000")
      const input = await focusInput(wrapper)

      // Act
      await input.setValue("100.0001")
      await input.trigger("keydown", { key: "Enter" })
      await nextTick()
      await input.setValue("100.0002")
      const editableDisplay = input.element.value
      await blurInput(wrapper)

      // Assert
      expect({
        editableDisplay,
        amount: wrapper.get("output").text(),
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        editableDisplay: "100.0002",
        amount: "100.0002",
        updates: [["100.0001"], ["100.0002"]],
      })
    })

    test("when cancelling with Escape, restores the committed value without a blur commit", async () => {
      // Arrange
      const wrapper = mountParent("100.0000")
      const input = await focusInput(wrapper)

      // Act
      await input.setValue("200.0000")
      await input.trigger("keydown", { key: "Escape" })
      await blurInput(wrapper)

      // Assert
      expect({
        amount: wrapper.get("output").text(),
        display: input.element.value,
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        amount: "100.0000",
        display: "$100.0000",
        updates: undefined,
      })
    })

    test("when editing again after Escape, commits only the new edit", async () => {
      // Arrange
      const wrapper = mountParent("100.0000")
      const input = await focusInput(wrapper)

      // Act
      await input.setValue("200.0000")
      await input.trigger("keydown", { key: "Escape" })
      await input.setValue("100.0001")
      await blurInput(wrapper)

      // Assert
      expect({
        amount: wrapper.get("output").text(),
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        amount: "100.0001",
        updates: [["100.0001"]],
      })
    })

    test("when receiving an external value while focused, updates display and validation", async () => {
      // Arrange
      const receivedValues: unknown[] = []
      const rule: ValidationRule = (value) => {
        receivedValues.push(value)
        return value === "200.0000" || "Expected the latest decimal amount"
      }
      const wrapper = mountParent("100.0000", [rule])
      const input = await focusInput(wrapper)
      const field = wrapper.findComponent({ name: "VTextField" })
      const fieldInstance = field.vm as unknown as { validate: () => Promise<string[]> }
      const originalErrors = await fieldInstance.validate()

      // Act
      await input.setValue("300.0000")
      setParentAmount(wrapper, "200.0000")
      await nextTick()
      const focusedDisplay = input.element.value
      const updatedErrors = await fieldInstance.validate()
      const validatedValue = receivedValues.at(-1)
      await input.trigger("keydown", { key: "Escape" })
      await blurInput(wrapper)

      // Assert
      expect({
        originalErrors,
        focusedDisplay,
        updatedErrors,
        validatedValue,
        amount: wrapper.get("output").text(),
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        originalErrors: ["Expected the latest decimal amount"],
        focusedDisplay: "200.0000",
        updatedErrors: [],
        validatedValue: "200.0000",
        amount: "200.0000",
        updates: undefined,
      })
    })

    test.each(["", null])(
      "when mounting an empty amount (%s), leaves the field empty for required validation",
      async (initialAmount) => {
        // Arrange
        const rule: ValidationRule = (value) => {
          return value !== null || "Amount is required"
        }
        const wrapper = mountParent(initialAmount, [rule])
        await nextTick()
        const input = wrapper.get("input")
        const field = wrapper.findComponent({ name: "VTextField" })
        const fieldInstance = field.vm as unknown as { validate: () => Promise<string[]> }

        // Act
        const errors = await fieldInstance.validate()

        // Assert
        expect({
          display: input.element.value,
          errors,
        }).toEqual({
          display: "",
          errors: ["Amount is required"],
        })
      }
    )

    test("when clearing a committed amount, validates an empty value and restores it on blur", async () => {
      // Arrange
      const receivedValues: unknown[] = []
      const rule: ValidationRule = (value) => {
        receivedValues.push(value)
        return true
      }
      const wrapper = mountParent("150.0000", [rule])
      const input = await focusInput(wrapper)
      const field = wrapper.findComponent({ name: "VTextField" })
      const fieldInstance = field.vm as unknown as { validate: () => Promise<string[]> }

      // Act
      await input.setValue("")
      await fieldInstance.validate()
      const emptyValidationValue = receivedValues.at(-1)
      await blurInput(wrapper)

      // Assert
      expect({
        emptyValidationValue,
        amount: wrapper.get("output").text(),
        display: input.element.value,
        updates: wrapper.findComponent(CurrencyInput).emitted("update:modelValue"),
      }).toEqual({
        emptyValidationValue: null,
        amount: "150.0000",
        display: "$150.0000",
        updates: undefined,
      })
    })
  })
})

function mountParent(initialAmount: string | null, rules: ValidationRule[] = []): VueWrapper {
  const Parent = defineComponent({
    components: { CurrencyInput },
    setup() {
      const amount = ref(initialAmount)

      function setAmount(value: string | null) {
        amount.value = value
      }

      return {
        amount,
        rules,
        setAmount,
      }
    },
    template: `
      <div>
        <CurrencyInput v-model="amount" :rules="rules" />
        <output>{{ amount === null ? "null" : amount }}</output>
      </div>
    `,
  })
  const wrapper = mount(Parent, {
    attachTo: document.body,
    global: {
      plugins: [mockVuetify()],
    },
  })

  mountedWrappers.push(wrapper)
  return wrapper
}

async function focusInput(wrapper: VueWrapper): Promise<DOMWrapper<HTMLInputElement>> {
  await nextTick()

  const input = wrapper.get("input") as DOMWrapper<HTMLInputElement>
  vi.useFakeTimers()
  try {
    input.element.focus()
    vi.runOnlyPendingTimers()
  } finally {
    vi.useRealTimers()
  }

  await nextTick()
  return input
}

async function blurInput(wrapper: VueWrapper) {
  const inputElement = wrapper.get("input").element as HTMLInputElement
  inputElement.blur()
  await nextTick()
}

function setParentAmount(wrapper: VueWrapper, value: string | null) {
  const parent = wrapper.vm as unknown as {
    setAmount: (amount: string | null) => void
  }
  parent.setAmount(value)
}
