import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import { employeeBenefitFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import EmployeeBenefitEditTable from "@/components/employee-benefits/EmployeeBenefitEditTable.vue"

enableAutoUnmount(afterEach)

describe("web/src/components/employee-benefits/EmployeeBenefitEditTable.vue", () => {
  test("when a currency edit is committed with Enter, saves it without a separate Save action", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({
      id: 61,
      employerCostEstimated: "100.0000",
    })
    vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
      employeeBenefit,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    const update = vi.spyOn(employeeBenefitsApi, "update").mockResolvedValue({
      employeeBenefit,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 61 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()
    const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')

    // Act
    await input.setValue("125")
    await input.trigger("keydown", { key: "Enter" })
    await flushPromises()

    // Assert
    expect(update).toHaveBeenCalledWith(61, { employerCostEstimated: "125.0000" })
    expect(wrapper.findAll("button").map((button) => button.text().trim())).not.toContain("Save")
  })

  test("when a percentage edit is committed with Enter, saves the fractional decimal", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({ id: 63 })
    vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
      employeeBenefit,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    const update = vi.spyOn(employeeBenefitsApi, "update").mockResolvedValue({
      employeeBenefit,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 63 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    await wrapper.get('[aria-label="show/hide cost cap percentage input"]').trigger("click")
    const input = wrapper.get('input[aria-label="Cost Cap Percentage"]')
    await input.setValue("12.5")
    await input.trigger("keydown", { key: "Enter" })
    await flushPromises()

    // Assert
    expect(update).toHaveBeenCalledWith(63, { costCapPercentage: "0.1250" })
    expect(wrapper.text()).toContain("12.50% of above")
  })

  test("when a failed load is retried, replaces the error state with the selected record", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({ id: 64 })
    vi.spyOn(employeeBenefitsApi, "get")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        employeeBenefit,
        policy: { show: true, create: true, update: true, destroy: true },
      })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 64 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    await wrapper.get("button").trigger("click")
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain("Gross Payroll")
    expect(wrapper.text()).not.toContain("could not be loaded")
  })

  test("when a failed autosave is retried slowly, retains the failure and shows the saving state", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({ id: 62 })
    const retry = Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
      employeeBenefit,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    const update = vi
      .spyOn(employeeBenefitsApi, "update")
      .mockRejectedValueOnce(new Error("offline"))
      .mockReturnValueOnce(retry.promise)
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 62 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("50")
    await input.trigger("keydown", { key: "Enter" })
    await flushPromises()
    const retryButton = wrapper.get("td.text-right button")
    await retryButton.trigger("click")
    await flushPromises()

    // Assert
    expect(update).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain("Saving changes…")
    expect(wrapper.get('[role="alert"]').text()).toContain("offline")
  })
})
