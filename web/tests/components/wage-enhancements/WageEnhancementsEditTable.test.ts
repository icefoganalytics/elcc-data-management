import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"

import employeeWageTiersApi from "@/api/employee-wage-tiers-api"
import wageEnhancementsApi from "@/api/wage-enhancements-api"

import { employeeWageTierFactory, wageEnhancementFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import WageEnhancementsEditTable from "@/components/wage-enhancements/WageEnhancementsEditTable.vue"

vi.mock("@/use/use-snack", () => ({
  default: () => ({ success: vi.fn(), error: vi.fn() }),
}))

enableAutoUnmount(afterEach)

describe("web/src/components/wage-enhancements/WageEnhancementsEditTable.vue", () => {
  test("when a second edit is committed during a slow save, persists it without replacing the input", async () => {
    // Arrange
    const employeeWageTier = employeeWageTierFactory.build({ id: 2, wageRatePerHour: "20.00" })
    const wageEnhancement = wageEnhancementFactory.build(
      {
        id: 3,
        centreId: 1,
        employeeWageTierId: employeeWageTier.id,
        employeeName: "Alex",
        hoursEstimated: "1.2500",
        hoursActual: "0.5000",
      },
      { associations: { employeeWageTier } }
    )
    const policy = { show: true, create: true, update: true, destroy: true }
    const firstSave = Promise.withResolvers<void>()
    vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
      employeeWageTiers: [employeeWageTier],
      totalCount: 1,
    })
    vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
      wageEnhancements: [wageEnhancement],
      totalCount: 1,
    })
    const update = vi
      .spyOn(wageEnhancementsApi, "update")
      .mockResolvedValue({ wageEnhancement, policy })
      .mockImplementationOnce(async () => {
        await firstSave.promise
        return { wageEnhancement, policy }
      })
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: employeeWageTier.fiscalPeriodId },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()
    const hours = wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]')

    // Act
    await hours.setValue("2.1250")
    await hours.trigger("blur")
    await flushPromises()
    await hours.setValue("3.3750")
    await hours.trigger("blur")
    firstSave.resolve()
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [3, { employeeName: "Alex", hoursEstimated: "2.1250", hoursActual: "0.5000" }],
      [3, { employeeName: "Alex", hoursEstimated: "3.3750", hoursActual: "0.5000" }],
    ])
    expect(hours.element.value).toBe("3.3750")
  })

  test("when a failed save is retried, preserves the input and clears the failure only after success", async () => {
    // Arrange
    const employeeWageTier = employeeWageTierFactory.build({ id: 2, wageRatePerHour: "20.00" })
    const wageEnhancement = wageEnhancementFactory.build(
      {
        id: 3,
        centreId: 1,
        employeeWageTierId: employeeWageTier.id,
        employeeName: "Alex",
        hoursEstimated: "1.2500",
        hoursActual: "0.5000",
      },
      { associations: { employeeWageTier } }
    )
    const policy = { show: true, create: true, update: true, destroy: true }
    vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
      employeeWageTiers: [employeeWageTier],
      totalCount: 1,
    })
    vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
      wageEnhancements: [wageEnhancement],
      totalCount: 1,
    })
    const update = vi
      .spyOn(wageEnhancementsApi, "update")
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValue({ wageEnhancement, policy })
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: employeeWageTier.fiscalPeriodId },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()
    const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')

    // Act
    await employeeName.setValue("Alexandra")
    await employeeName.trigger("blur")
    await flushPromises()

    const failureMessage = wrapper.get('[role="alert"]').text()
    const retainedName = employeeName.element.value
    await wrapper.get('[aria-label="Retry saving employee"]').trigger("click")
    await flushPromises()

    // Assert
    expect(failureMessage).toContain("network unavailable")
    expect(retainedName).toBe("Alexandra")
    expect(update).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain("network unavailable")
    expect(employeeName.element.value).toBe("Alexandra")
  })
})
