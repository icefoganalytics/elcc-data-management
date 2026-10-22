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
  test("when a second edit is committed during a slow save, persists both updates", async () => {
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
  })

  test("when a second edit is committed during a slow save, retains the latest input", async () => {
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
    vi.spyOn(wageEnhancementsApi, "update")
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
    expect(wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]').element.value).toBe(
      "3.3750"
    )
  })

  test("when a failed save is retried while pending, retains the input and visible failure", async () => {
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
    const retry = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
    vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
      employeeWageTiers: [employeeWageTier],
      totalCount: 1,
    })
    vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
      wageEnhancements: [wageEnhancement],
      totalCount: 1,
    })
    vi.spyOn(wageEnhancementsApi, "update")
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockReturnValueOnce(retry.promise)
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: employeeWageTier.fiscalPeriodId },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const employeeName = wrapper.get('input[aria-label="Employee Name"]')
    await employeeName.setValue("Alexandra")
    await employeeName.trigger("blur")
    await flushPromises()
    await wrapper.get('[aria-label="Retry saving employee"]').trigger("click")
    await flushPromises()

    // Assert
    expect(wrapper.get('[role="alert"]').text()).toContain("network unavailable")
    const retainedName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
    expect(retainedName.element.value).toBe("Alexandra")
  })

  test("when a failed save is retried successfully, clears the failure without losing the input", async () => {
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
    vi.spyOn(wageEnhancementsApi, "update")
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

    await wrapper.get('[aria-label="Retry saving employee"]').trigger("click")
    await flushPromises()

    // Assert
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    const savedName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
    expect(savedName.element.value).toBe("Alexandra")
  })

  test("when an earlier month request finishes last, shows only the selected month", async () => {
    // Arrange
    const employeeWageTier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const employeeWageTier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const wageEnhancement1 = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: employeeWageTier1.id,
      employeeName: "Alex",
    })
    const wageEnhancement2 = wageEnhancementFactory.build({
      id: 5,
      centreId: 1,
      employeeWageTierId: employeeWageTier2.id,
      employeeName: "Robin",
    })
    const firstLoad = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.list>>>()
    vi.spyOn(employeeWageTiersApi, "list")
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier2], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "list")
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement2], totalCount: 1 })
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: 1 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    await wrapper.setProps({ fiscalPeriodId: 2 })
    await flushPromises()
    firstLoad.resolve({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
    await flushPromises()

    // Assert
    expect(wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]').element.value).toBe(
      "Robin"
    )
    expect(wrapper.findAll('input[aria-label="Employee Name"]')).toHaveLength(1)
  })

  test("when a create response arrives after the returning query is edited, keeps one editable row", async () => {
    // Arrange
    const employeeWageTier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const employeeWageTier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const wageEnhancement = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: employeeWageTier1.id,
      employeeName: "",
    })
    const created = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.create>>>()
    const policy = { show: true, create: true, update: true, destroy: true }
    vi.spyOn(employeeWageTiersApi, "list")
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier2], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
      .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "create").mockReturnValueOnce(created.promise)
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: 1 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    await wrapper.get('[title="Add employee"]').trigger("click")
    await wrapper.setProps({ fiscalPeriodId: 2 })
    await flushPromises()
    await wrapper.setProps({ fiscalPeriodId: 1 })
    await flushPromises()
    const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
    await employeeName.setValue("Sam")
    created.resolve({
      wageEnhancement,
      policy,
    })
    await flushPromises()

    // Assert
    expect(wrapper.findAll('input[aria-label="Employee Name"]')).toHaveLength(1)
    expect(wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]').element.value).toBe(
      "Sam"
    )
  })

  test("when a committed revert is followed by month navigation, persists both updates", async () => {
    // Arrange
    const employeeWageTier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const employeeWageTier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const wageEnhancement = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: employeeWageTier1.id,
      employeeName: "Alex",
    })
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
    vi.spyOn(employeeWageTiersApi, "list")
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier2], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement], totalCount: 1 })
      .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement], totalCount: 1 })
    const update = vi
      .spyOn(wageEnhancementsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({
        wageEnhancement,
        policy: { show: true, create: true, update: true, destroy: true },
      })
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: 1 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
    await employeeName.setValue("Alexandra")
    await employeeName.trigger("blur")
    await employeeName.setValue("Alex")
    await employeeName.trigger("blur")
    await wrapper.setProps({ fiscalPeriodId: 2 })
    await flushPromises()
    await wrapper.setProps({ fiscalPeriodId: 1 })
    await flushPromises()
    firstSave.resolve({
      wageEnhancement,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [3, { employeeName: "Alexandra", hoursEstimated: "0.0000", hoursActual: "0.0000" }],
      [3, { employeeName: "Alex", hoursEstimated: "0.0000", hoursActual: "0.0000" }],
    ])
  })

  test("when a committed revert is followed by month navigation, restores the reverted draft", async () => {
    // Arrange
    const employeeWageTier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const employeeWageTier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const wageEnhancement = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: employeeWageTier1.id,
      employeeName: "Alex",
    })
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
    vi.spyOn(employeeWageTiersApi, "list")
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier2], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement], totalCount: 1 })
      .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({
        wageEnhancement,
        policy: { show: true, create: true, update: true, destroy: true },
      })
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: 1 },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
    await employeeName.setValue("Alexandra")
    await employeeName.trigger("blur")
    await employeeName.setValue("Alex")
    await employeeName.trigger("blur")
    await wrapper.setProps({ fiscalPeriodId: 2 })
    await flushPromises()
    await wrapper.setProps({ fiscalPeriodId: 1 })
    await flushPromises()
    firstSave.resolve({
      wageEnhancement,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    await flushPromises()

    // Assert
    expect(wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]').element.value).toBe(
      "Alex"
    )
  })

  test("when list requests fail after a failed edit and create, retains both editable rows", async () => {
    // Arrange
    const employeeWageTier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const employeeWageTier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const wageEnhancement1 = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: employeeWageTier1.id,
      employeeName: "Alex",
    })
    const wageEnhancement2 = wageEnhancementFactory.build({
      id: 5,
      centreId: 1,
      employeeWageTierId: employeeWageTier1.id,
      employeeName: "",
    })
    const policy = { show: true, create: true, update: true, destroy: true }
    const handleError = vi.fn()
    const loadError = new Error("list unavailable")
    vi.spyOn(employeeWageTiersApi, "list")
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier2], totalCount: 1 })
      .mockResolvedValueOnce({ employeeWageTiers: [employeeWageTier1], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
      .mockRejectedValueOnce(loadError)
      .mockRejectedValueOnce(loadError)
    vi.spyOn(wageEnhancementsApi, "update").mockRejectedValueOnce(new Error("offline"))
    vi.spyOn(wageEnhancementsApi, "create").mockResolvedValue({
      wageEnhancement: wageEnhancement2,
      policy,
    })
    const wrapper = mount(WageEnhancementsEditTable, {
      props: { centreId: 1, fiscalPeriodId: 1 },
      global: {
        plugins: [mockVuetify()],
        config: { errorHandler: handleError },
      },
    })
    await flushPromises()

    // Act
    const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
    await employeeName.setValue("Alexandra")
    await employeeName.trigger("blur")
    await flushPromises()
    await wrapper.get('[title="Add employee"]').trigger("click")
    await flushPromises()
    await wrapper.setProps({ fiscalPeriodId: 2 })
    await flushPromises()
    await wrapper.setProps({ fiscalPeriodId: 1 })
    await flushPromises()

    // Assert
    const employeeNames = wrapper.findAll<HTMLInputElement>('input[aria-label="Employee Name"]')
    expect(employeeNames).toHaveLength(2)
    expect(employeeNames[0].element.value).toBe("Alexandra")
    expect(employeeNames[1].element.value).toBe("")
    expect(wrapper.text()).toContain("offline")
  })
})
