import { nextTick, ref } from "vue"
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"
import type { VueWrapper } from "@vue/test-utils"

import employeeBenefitsApi, {
  type EmployeeBenefitAsShow,
  type EmployeeBenefitPolicy,
} from "@/api/employee-benefits-api"
import CurrencyInput from "@/components/CurrencyInput.vue"
import EmployeeBenefitEditTable from "@/components/employee-benefits/EmployeeBenefitEditTable.vue"
import { mockVuetify } from "@/tests/support"

vi.mock("@/api/employee-benefits-api", () => ({
  default: {
    update: vi.fn(),
  },
}))

vi.mock("@/use/use-employee-benefit", () => ({
  default: () => ({
    employeeBenefit: ref({
      id: 42,
      centreId: 4,
      fiscalPeriodId: 2026,
      grossPayrollMonthlyActual: "0.0000",
      grossPayrollMonthlyEstimated: "100.0000",
      costCapPercentage: "0.1000",
      employeeCostActual: "0.0000",
      employeeCostEstimated: "10.0000",
      employerCostActual: "0.0000",
      employerCostEstimated: "20.0000",
      createdAt: "",
      updatedAt: "",
    }),
    isLoading: ref(false),
  }),
}))

enableAutoUnmount(afterEach)

const updateEmployeeBenefit = vi.mocked(employeeBenefitsApi.update)
const staleServerEmployeeBenefit: EmployeeBenefitAsShow = {
  id: 42,
  centreId: 4,
  fiscalPeriodId: 2026,
  grossPayrollMonthlyActual: "0.0000",
  grossPayrollMonthlyEstimated: "100.0000",
  costCapPercentage: "0.1000",
  employeeCostActual: "0.0000",
  employeeCostEstimated: "10.0000",
  employerCostActual: "0.0000",
  employerCostEstimated: "20.0000",
  createdAt: "",
  updatedAt: "",
}
const employeeBenefitPolicy: EmployeeBenefitPolicy = {
  show: true,
  create: true,
  update: true,
  destroy: true,
}

type EmployeeBenefitUpdateResult = {
  employeeBenefit: EmployeeBenefitAsShow
  policy: EmployeeBenefitPolicy
}

function getCurrencyInput(wrapper: VueWrapper, label: string) {
  const input = wrapper
    .findAllComponents(CurrencyInput)
    .find((component) => component.find(`input[aria-label="${label}"]`).exists())
  if (!input) {
    throw new Error(`Currency input "${label}" was not rendered`)
  }

  return input
}

describe("web/src/components/employee-benefits/EmployeeBenefitEditTable.vue", () => {
  test("when a newer value is entered during a slow save, saves it without replacing the local edit", async () => {
    // Arrange
    updateEmployeeBenefit.mockReset()
    updateEmployeeBenefit.mockResolvedValue({
      employeeBenefit: staleServerEmployeeBenefit,
      policy: employeeBenefitPolicy,
    })
    const firstSave = Promise.withResolvers<EmployeeBenefitUpdateResult>()
    updateEmployeeBenefit.mockImplementationOnce(() => firstSave.promise)
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 42 },
      global: { plugins: [mockVuetify()] },
    })
    await nextTick()
    const estimatedPayroll = getCurrencyInput(wrapper, "Gross Payroll Monthly Estimated")

    // Act
    estimatedPayroll?.vm.$emit("update:modelValue", "101.0000")
    estimatedPayroll?.vm.$emit("update:modelValue", "102.3456")
    firstSave.resolve({
      employeeBenefit: staleServerEmployeeBenefit,
      policy: employeeBenefitPolicy,
    })
    await flushPromises()

    // Assert
    expect({
      patches: updateEmployeeBenefit.mock.calls,
      localValue: estimatedPayroll?.props("modelValue"),
    }).toEqual({
      patches: [
        [42, { grossPayrollMonthlyEstimated: "101.0000" }],
        [42, { grossPayrollMonthlyEstimated: "102.3456" }],
      ],
      localValue: "102.3456",
    })
  })

  test("when the value returns to its original value during a slow save, persists the revert", async () => {
    // Arrange
    updateEmployeeBenefit.mockReset()
    updateEmployeeBenefit.mockResolvedValue({
      employeeBenefit: staleServerEmployeeBenefit,
      policy: employeeBenefitPolicy,
    })
    const firstSave = Promise.withResolvers<EmployeeBenefitUpdateResult>()
    updateEmployeeBenefit.mockImplementationOnce(() => firstSave.promise)
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 42 },
      global: { plugins: [mockVuetify()] },
    })
    await nextTick()
    const estimatedPayroll = getCurrencyInput(wrapper, "Gross Payroll Monthly Estimated")

    // Act
    estimatedPayroll?.vm.$emit("update:modelValue", "101.0000")
    estimatedPayroll?.vm.$emit("update:modelValue", "100.0000")
    firstSave.resolve({
      employeeBenefit: staleServerEmployeeBenefit,
      policy: employeeBenefitPolicy,
    })
    await flushPromises()

    // Assert
    expect({
      patches: updateEmployeeBenefit.mock.calls,
      localValue: estimatedPayroll?.props("modelValue"),
    }).toEqual({
      patches: [
        [42, { grossPayrollMonthlyEstimated: "101.0000" }],
        [42, { grossPayrollMonthlyEstimated: "100.0000" }],
      ],
      localValue: "100.0000",
    })
  })

  test("when one save fails and another succeeds, shows the failure until retry succeeds", async () => {
    // Arrange
    updateEmployeeBenefit.mockReset()
    updateEmployeeBenefit.mockResolvedValue({
      employeeBenefit: staleServerEmployeeBenefit,
      policy: employeeBenefitPolicy,
    })
    updateEmployeeBenefit.mockRejectedValueOnce(new Error("network unavailable"))
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 42 },
      global: { plugins: [mockVuetify()] },
    })
    await nextTick()
    const estimatedPayroll = getCurrencyInput(wrapper, "Gross Payroll Monthly Estimated")
    const actualPayroll = getCurrencyInput(wrapper, "Gross Payroll Monthly Actual")

    // Act
    estimatedPayroll?.vm.$emit("update:modelValue", "123.4567")
    await flushPromises()
    actualPayroll?.vm.$emit("update:modelValue", "456.7891")
    await flushPromises()

    const failureMessage = wrapper.get('[role="alert"]').text()
    const retainedEstimatedPayroll = estimatedPayroll.props("modelValue")
    const retainedActualPayroll = actualPayroll.props("modelValue")

    const saveButton = wrapper.get("button.bg-success")
    await saveButton.trigger("click")
    await flushPromises()

    // Assert
    expect({
      failureMessage,
      retainedEstimatedPayroll,
      retainedActualPayroll,
      failureAlertVisible: wrapper.find('[role="alert"]').exists(),
      estimatedPayroll: estimatedPayroll?.props("modelValue"),
      latestPatch: updateEmployeeBenefit.mock.calls[updateEmployeeBenefit.mock.calls.length - 1],
    }).toEqual({
      failureMessage: expect.stringContaining("network unavailable"),
      retainedEstimatedPayroll: "123.4567",
      retainedActualPayroll: "456.7891",
      failureAlertVisible: false,
      estimatedPayroll: "123.4567",
      latestPatch: [42, { grossPayrollMonthlyEstimated: "123.4567" }],
    })
  })
})
