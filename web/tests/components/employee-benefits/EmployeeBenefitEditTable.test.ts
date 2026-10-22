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
    const saveButton = wrapper.findAll("button").find((button) => button.text().trim() === "Save")
    expect(update).toHaveBeenCalledWith(61, { employerCostEstimated: "125.0000" })
    expect(saveButton).toBeUndefined()
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
    expect(wrapper.get('[aria-label="Saving employee benefits"]').attributes("aria-hidden")).toBe(
      "false"
    )
    expect(wrapper.get('[role="alert"]').text()).toContain("offline")
  })

  test("when a committed revert is queued before month navigation, persists both writes and restores the selected value", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({
      id: 41,
      employerCostEstimated: "120.0000",
    })
    const policy = { show: true, create: true, update: true, destroy: true }
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
    const update = vi
      .spyOn(employeeBenefitsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({ employeeBenefit, policy })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 41 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("100")
    await input.trigger("keydown", { key: "Enter" })
    await input.setValue("120")
    await input.trigger("keydown", { key: "Enter" })
    await wrapper.setProps({ employeeBenefitId: undefined })
    await wrapper.setProps({ employeeBenefitId: 41 })
    await flushPromises()
    firstSave.resolve({ employeeBenefit, policy })
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [41, { employerCostEstimated: "100.0000" }],
      [41, { employerCostEstimated: "120.0000" }],
    ])
    const returningInput = wrapper.get<HTMLInputElement>(
      'input[aria-label="Employer Cost Estimated"]'
    )
    expect(returningInput.element.value).toBe("$120.0000")
  })

  test("when an earlier write finishes after returning, saves a committed revert against its acknowledgement", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({
      id: 41,
      employerCostEstimated: "120.0000",
    })
    const policy = { show: true, create: true, update: true, destroy: true }
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
    const update = vi
      .spyOn(employeeBenefitsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({ employeeBenefit, policy })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 41 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("100")
    await input.trigger("keydown", { key: "Enter" })
    await wrapper.setProps({ employeeBenefitId: undefined })
    await wrapper.setProps({ employeeBenefitId: 41 })
    await flushPromises()
    firstSave.resolve({ employeeBenefit, policy })
    await flushPromises()
    const returnedInput = wrapper.get<HTMLInputElement>(
      'input[aria-label="Employer Cost Estimated"]'
    )
    await returnedInput.setValue("120")
    await returnedInput.trigger("keydown", { key: "Enter" })
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [41, { employerCostEstimated: "100.0000" }],
      [41, { employerCostEstimated: "120.0000" }],
    ])
  })

  test("when a write finishes during the return load, preserves its acknowledgement for a later revert", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({
      id: 41,
      employerCostEstimated: "120.0000",
    })
    const policy = { show: true, create: true, update: true, destroy: true }
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    const returnLoad = Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.get>>>()
    vi.spyOn(employeeBenefitsApi, "get")
      .mockResolvedValueOnce({ employeeBenefit, policy })
      .mockReturnValueOnce(returnLoad.promise)
    const update = vi
      .spyOn(employeeBenefitsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({ employeeBenefit, policy })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 41 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("100")
    await input.trigger("keydown", { key: "Enter" })
    await wrapper.setProps({ employeeBenefitId: undefined })
    await wrapper.setProps({ employeeBenefitId: 41 })
    firstSave.resolve({ employeeBenefit, policy })
    await flushPromises()
    returnLoad.resolve({ employeeBenefit, policy })
    await flushPromises()
    const returnedInput = wrapper.get<HTMLInputElement>(
      'input[aria-label="Employer Cost Estimated"]'
    )
    await returnedInput.setValue("120")
    await returnedInput.trigger("keydown", { key: "Enter" })
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [41, { employerCostEstimated: "100.0000" }],
      [41, { employerCostEstimated: "120.0000" }],
    ])
  })

  test("when a write and revert finish during the return load, rejects the stale intermediate value", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({
      id: 41,
      employerCostEstimated: "120.0000",
    })
    const intermediateBenefit = employeeBenefitFactory.build({
      ...employeeBenefit,
      employerCostEstimated: "100.0000",
    })
    const policy = { show: true, create: true, update: true, destroy: true }
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    const returnLoad = Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.get>>>()
    vi.spyOn(employeeBenefitsApi, "get")
      .mockResolvedValueOnce({ employeeBenefit, policy })
      .mockReturnValueOnce(returnLoad.promise)
    const update = vi
      .spyOn(employeeBenefitsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({ employeeBenefit, policy })
    const wrapper = mount(EmployeeBenefitEditTable, {
      props: { employeeBenefitId: 41 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("100")
    await input.trigger("keydown", { key: "Enter" })
    await input.setValue("120")
    await input.trigger("keydown", { key: "Enter" })
    await wrapper.setProps({ employeeBenefitId: undefined })
    await wrapper.setProps({ employeeBenefitId: 41 })
    firstSave.resolve({ employeeBenefit: intermediateBenefit, policy })
    await flushPromises()
    returnLoad.resolve({ employeeBenefit: intermediateBenefit, policy })
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [41, { employerCostEstimated: "100.0000" }],
      [41, { employerCostEstimated: "120.0000" }],
    ])
    const returningInput = wrapper.get<HTMLInputElement>(
      'input[aria-label="Employer Cost Estimated"]'
    )
    expect(returningInput.element.value).toBe("$120.0000")
  })
})
