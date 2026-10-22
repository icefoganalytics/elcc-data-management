import { flushPromises, mount } from "@vue/test-utils"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import employeeWageTiersApi from "@/api/employee-wage-tiers-api"
import fiscalPeriodsApi, { FiscalPeriodMonths } from "@/api/fiscal-periods-api"
import wageEnhancementsApi from "@/api/wage-enhancements-api"
import {
  employeeBenefitFactory,
  employeeWageTierFactory,
  wageEnhancementFactory,
} from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import CentreDashboardEmployeesMonthlyWorksheetPage from "@/modules/centre/pages/CentreDashboardEmployeesMonthlyWorksheetPage.vue"

describe("web/src/modules/centre/pages/CentreDashboardEmployeesMonthlyWorksheetPage.vue", () => {
  test("when returning to a month with an unfinished save, queues a committed revert behind the original write", async () => {
    // Arrange
    const period1 = {
      id: 1,
      fundingPeriodId: 1,
      fiscalYear: "2026-27",
      month: FiscalPeriodMonths.APRIL,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-30",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const period2 = {
      ...period1,
      id: 2,
      month: FiscalPeriodMonths.MAY,
      dateStart: "2026-05-01",
      dateEnd: "2026-05-31",
    }
    const benefit1 = employeeBenefitFactory.build({
      id: 41,
      centreId: 1,
      fiscalPeriodId: 1,
      employerCostEstimated: "120.0000",
    })
    const benefit2 = employeeBenefitFactory.build({ id: 42, centreId: 1, fiscalPeriodId: 2 })
    vi.spyOn(fiscalPeriodsApi, "list").mockImplementation(async (query) => ({
      fiscalPeriods: [query?.where?.month === FiscalPeriodMonths.MAY ? period2 : period1],
      totalCount: 1,
    }))
    vi.spyOn(employeeBenefitsApi, "list").mockImplementation(async (query) => ({
      employeeBenefits: [query?.where?.fiscalPeriodId === 2 ? benefit2 : benefit1],
      totalCount: 1,
    }))
    vi.spyOn(employeeBenefitsApi, "get").mockImplementation(async (id) => ({
      employeeBenefit: id === 42 ? benefit2 : benefit1,
      policy: { show: true, create: true, update: true, destroy: true },
    }))
    vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
      employeeWageTiers: [],
      totalCount: 0,
    })
    vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({ wageEnhancements: [], totalCount: 0 })
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    const update = vi
      .spyOn(employeeBenefitsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({
        employeeBenefit: benefit1,
        policy: { show: true, create: true, update: true, destroy: true },
      })
    const wrapper = mount(CentreDashboardEmployeesMonthlyWorksheetPage, {
      props: { centreId: 1, fiscalYearSlug: "2026-27", month: FiscalPeriodMonths.APRIL },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("100")
    await input.trigger("keydown", { key: "Enter" })
    await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
    await flushPromises()
    await wrapper.setProps({ month: FiscalPeriodMonths.APRIL })
    await flushPromises()
    const returningInput = wrapper.get('input[aria-label="Employer Cost Estimated"]')
    await returningInput.setValue("120")
    await returningInput.trigger("keydown", { key: "Enter" })
    const writesBeforeAcknowledgement = update.mock.calls.length
    firstSave.resolve({
      employeeBenefit: benefit1,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    await flushPromises()

    // Assert
    expect(writesBeforeAcknowledgement).toBe(1)
    expect(update.mock.calls).toEqual([
      [41, { employerCostEstimated: "100.0000" }],
      [41, { employerCostEstimated: "120.0000" }],
    ])
  })

  test("when returning to a month after a failed save, retains the input and Retry feedback", async () => {
    // Arrange
    const period1 = {
      id: 1,
      fundingPeriodId: 1,
      fiscalYear: "2026-27",
      month: FiscalPeriodMonths.APRIL,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-30",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const period2 = { ...period1, id: 2, month: FiscalPeriodMonths.MAY }
    const benefit1 = employeeBenefitFactory.build({
      id: 41,
      fiscalPeriodId: 1,
      employerCostEstimated: "120.0000",
    })
    const benefit2 = employeeBenefitFactory.build({ id: 42, fiscalPeriodId: 2 })
    vi.spyOn(fiscalPeriodsApi, "list").mockImplementation(async (query) => ({
      fiscalPeriods: [query?.where?.month === FiscalPeriodMonths.MAY ? period2 : period1],
      totalCount: 1,
    }))
    vi.spyOn(employeeBenefitsApi, "list").mockImplementation(async (query) => ({
      employeeBenefits: [query?.where?.fiscalPeriodId === 2 ? benefit2 : benefit1],
      totalCount: 1,
    }))
    vi.spyOn(employeeBenefitsApi, "get").mockImplementation(async (id) => ({
      employeeBenefit: id === 42 ? benefit2 : benefit1,
      policy: { show: true, create: true, update: true, destroy: true },
    }))
    vi.spyOn(employeeBenefitsApi, "update").mockRejectedValue(new Error("offline"))
    vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
      employeeWageTiers: [],
      totalCount: 0,
    })
    vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
      wageEnhancements: [],
      totalCount: 0,
    })
    const wrapper = mount(CentreDashboardEmployeesMonthlyWorksheetPage, {
      props: { centreId: 1, fiscalYearSlug: "2026-27", month: FiscalPeriodMonths.APRIL },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    const input = wrapper.get('input[aria-label="Employer Cost Estimated"]')
    await input.setValue("150")
    await input.trigger("keydown", { key: "Enter" })
    await flushPromises()
    await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
    await flushPromises()
    await wrapper.setProps({ month: FiscalPeriodMonths.APRIL })
    await flushPromises()

    // Assert
    expect(
      wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]').element.value
    ).toBe("$150.0000")
    expect(wrapper.get('[role="alert"]').text()).toContain("offline")
  })

  test("when a wage save and employee creation finish in an inactive month, retains the edited rows on return", async () => {
    // Arrange
    const period1 = {
      id: 1,
      fundingPeriodId: 1,
      fiscalYear: "2026-27",
      month: FiscalPeriodMonths.APRIL,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-30",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const period2 = { ...period1, id: 2, month: FiscalPeriodMonths.MAY }
    const tier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const tier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const employee1 = wageEnhancementFactory.build(
      { id: 3, centreId: 1, employeeName: "Alex" },
      { associations: { employeeWageTier: tier1 } }
    )
    const employee2 = wageEnhancementFactory.build(
      { id: 5, centreId: 1, employeeName: "" },
      { associations: { employeeWageTier: tier1 } }
    )
    const policy = { show: true, create: true, update: true, destroy: true }
    const save = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
    const creation = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.create>>>()
    const savedEmployees = [employee1]
    vi.spyOn(fiscalPeriodsApi, "list").mockImplementation(async (query) => ({
      fiscalPeriods: [query?.where?.month === FiscalPeriodMonths.MAY ? period2 : period1],
      totalCount: 1,
    }))
    vi.spyOn(employeeBenefitsApi, "list").mockResolvedValue({
      employeeBenefits: [],
      totalCount: 0,
    })
    vi.spyOn(employeeWageTiersApi, "list").mockImplementation(async (query) => ({
      employeeWageTiers: [query?.where?.fiscalPeriodId === 2 ? tier2 : tier1],
      totalCount: 1,
    }))
    vi.spyOn(wageEnhancementsApi, "list").mockImplementation(async (query) => {
      const tierIds = query?.where?.employeeWageTierId
      if (Array.isArray(tierIds) && tierIds.includes(tier1.id)) {
        return {
          wageEnhancements: structuredClone(savedEmployees),
          totalCount: savedEmployees.length,
        }
      }

      return { wageEnhancements: [], totalCount: 0 }
    })
    vi.spyOn(wageEnhancementsApi, "update").mockReturnValueOnce(save.promise)
    vi.spyOn(wageEnhancementsApi, "create").mockReturnValueOnce(creation.promise)
    const wrapper = mount(CentreDashboardEmployeesMonthlyWorksheetPage, {
      props: { centreId: 1, fiscalYearSlug: "2026-27", month: FiscalPeriodMonths.APRIL },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    await wrapper.get('input[aria-label="Employee Name"]').setValue("Alexandra")
    await wrapper.get('input[aria-label="Employee Name"]').trigger("blur")
    await wrapper.get('[title="Add employee"]').trigger("click")
    await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
    await flushPromises()
    employee1.employeeName = "Alexandra"
    savedEmployees.push(employee2)
    save.resolve({ wageEnhancement: employee1, policy })
    creation.resolve({ wageEnhancement: employee2, policy })
    await flushPromises()
    await wrapper.setProps({ month: FiscalPeriodMonths.APRIL })
    await flushPromises()

    // Assert
    const names = wrapper.findAll<HTMLInputElement>('input[aria-label="Employee Name"]')
    expect(names).toHaveLength(2)
    expect(names[0].element.value).toBe("Alexandra")
    expect(names[1].element.value).toBe("")
  })

  test("when estimates are replicated into a previously visited month, displays the replicated hours on return", async () => {
    // Arrange
    const period1 = {
      id: 1,
      fundingPeriodId: 1,
      fiscalYear: "2026-27",
      month: FiscalPeriodMonths.APRIL,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-30",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const period2 = { ...period1, id: 2, month: FiscalPeriodMonths.MAY }
    const tier1 = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
    const tier2 = employeeWageTierFactory.build({ id: 4, fiscalPeriodId: 2 })
    const employee1 = wageEnhancementFactory.build(
      { id: 3, centreId: 1, hoursEstimated: "80.0000" },
      { associations: { employeeWageTier: tier1 } }
    )
    const employee2 = wageEnhancementFactory.build(
      { id: 5, centreId: 1, hoursEstimated: "20.0000" },
      { associations: { employeeWageTier: tier2 } }
    )
    vi.spyOn(fiscalPeriodsApi, "list").mockImplementation(async (query) => ({
      fiscalPeriods: [query?.where?.month === FiscalPeriodMonths.MAY ? period2 : period1],
      totalCount: 1,
    }))
    vi.spyOn(employeeBenefitsApi, "list").mockResolvedValue({
      employeeBenefits: [],
      totalCount: 0,
    })
    vi.spyOn(employeeWageTiersApi, "list").mockImplementation(async (query) => ({
      employeeWageTiers: [query?.where?.fiscalPeriodId === 2 ? tier2 : tier1],
      totalCount: 1,
    }))
    vi.spyOn(wageEnhancementsApi, "list").mockImplementation(async (query) => {
      const tierIds = query?.where?.employeeWageTierId
      if (Array.isArray(tierIds) && tierIds.includes(tier2.id)) {
        return { wageEnhancements: structuredClone([employee2]), totalCount: 1 }
      }

      return { wageEnhancements: structuredClone([employee1]), totalCount: 1 }
    })
    vi.spyOn(wageEnhancementsApi, "replicateEstimates").mockImplementation(async () => {
      employee2.hoursEstimated = "80.0000"
    })
    const wrapper = mount(CentreDashboardEmployeesMonthlyWorksheetPage, {
      props: { centreId: 1, fiscalYearSlug: "2026-27", month: FiscalPeriodMonths.MAY },
      global: { plugins: [mockVuetify()] },
    })
    await flushPromises()

    // Act
    await wrapper.setProps({ month: FiscalPeriodMonths.APRIL })
    await flushPromises()
    const replicateButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Replicate Estimates"))
    if (!replicateButton) throw new Error("Expected Replicate Estimates action")
    await replicateButton.trigger("click")
    await flushPromises()
    await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
    await flushPromises()

    // Assert
    expect(wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]').element.value).toBe(
      "80.0000"
    )
  })
})
