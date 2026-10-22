import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import employeeWageTiersApi from "@/api/employee-wage-tiers-api"
import fiscalPeriodsApi, { FiscalPeriodMonths } from "@/api/fiscal-periods-api"
import wageEnhancementsApi from "@/api/wage-enhancements-api"
import { employeeBenefitFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import CentreDashboardEmployeesMonthlyWorksheetPage from "@/modules/centre/pages/CentreDashboardEmployeesMonthlyWorksheetPage.vue"

enableAutoUnmount(afterEach)

describe("web/src/modules/centre/pages/CentreDashboardEmployeesMonthlyWorksheetPage.vue", () => {
  test("when returning to a month with an unfinished save, queues the new edit behind the original write", async () => {
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
    await returningInput.setValue("150")
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
      [41, { employerCostEstimated: "150.0000" }],
    ])
  })
})
