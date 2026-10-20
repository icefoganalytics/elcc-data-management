import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"

import employeeWageTiersApi from "@/api/employee-wage-tiers-api"
import wageEnhancementsApi from "@/api/wage-enhancements-api"

import { mockVuetify } from "@/tests/support"

import WageEnhancementTierTableBody from "@/components/wage-enhancements/WageEnhancementTierTableBody.vue"

vi.mock("@/use/use-snack", () => ({
  default: () => ({ success: vi.fn(), error: vi.fn() }),
}))

enableAutoUnmount(afterEach)

describe("web/src/components/wage-enhancements/WageEnhancementTierTableBody.vue", () => {
  describe("WageEnhancementTierTableBody", () => {
    describe("autosave", () => {
      test("when a newer value is committed during a slow save, it is saved without replacing the input", async () => {
        // Arrange
        const employeeWageTier = {
          id: 2,
          fiscalPeriodId: 1,
          tierLevel: 1,
          tierLabel: "Tier 1",
          wageRatePerHour: "20.00",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }
        const wageEnhancement = {
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
          hoursEstimated: "1.2500",
          hoursActual: "0.5000",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          employeeWageTier,
        }
        const policy = { show: true, create: true, update: true, destroy: true }
        const staleResponse = { wageEnhancement: { ...wageEnhancement }, policy }
        const firstSave = Promise.withResolvers<void>()
        vi.spyOn(employeeWageTiersApi, "get").mockResolvedValue({ employeeWageTier, policy })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        const updateWageEnhancement = vi
          .spyOn(wageEnhancementsApi, "update")
          .mockResolvedValue(staleResponse)
          .mockImplementationOnce(async () => {
            await firstSave.promise
            return staleResponse
          })
        const wrapper = mount(WageEnhancementTierTableBody, {
          props: {
            centreId: 1,
            employeeWageTierId: 2,
          },
          global: {
            plugins: [mockVuetify()],
          },
        })
        await flushPromises()
        const estimatedHours = wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]')

        // Act
        await estimatedHours.setValue("2.1250")
        await estimatedHours.trigger("blur")
        await flushPromises()
        await estimatedHours.setValue("3.3750")
        await estimatedHours.trigger("blur")
        firstSave.resolve()
        await flushPromises()

        // Assert
        expect(updateWageEnhancement.mock.calls).toEqual([
          [3, { hoursEstimated: "2.1250" }],
          [3, { hoursEstimated: "3.3750" }],
        ])
        expect(estimatedHours.element.value).toBe("3.3750")
      })

      test("when an input returns to its original value during a slow save, the original value is saved next", async () => {
        // Arrange
        const employeeWageTier = {
          id: 2,
          fiscalPeriodId: 1,
          tierLevel: 1,
          tierLabel: "Tier 1",
          wageRatePerHour: "20.00",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }
        const wageEnhancement = {
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
          hoursEstimated: "1.2500",
          hoursActual: "0.5000",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          employeeWageTier,
        }
        const policy = { show: true, create: true, update: true, destroy: true }
        const staleResponse = { wageEnhancement: { ...wageEnhancement }, policy }
        const firstSave = Promise.withResolvers<void>()
        vi.spyOn(employeeWageTiersApi, "get").mockResolvedValue({ employeeWageTier, policy })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        const updateWageEnhancement = vi
          .spyOn(wageEnhancementsApi, "update")
          .mockResolvedValue(staleResponse)
          .mockImplementationOnce(async () => {
            await firstSave.promise
            return staleResponse
          })
        const wrapper = mount(WageEnhancementTierTableBody, {
          props: {
            centreId: 1,
            employeeWageTierId: 2,
          },
          global: {
            plugins: [mockVuetify()],
          },
        })
        await flushPromises()
        const estimatedHours = wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]')

        // Act
        await estimatedHours.setValue("2.1250")
        await estimatedHours.trigger("blur")
        await flushPromises()
        await estimatedHours.setValue("1.2500")
        await estimatedHours.trigger("blur")
        firstSave.resolve()
        await flushPromises()

        // Assert
        expect(updateWageEnhancement.mock.calls).toEqual([
          [3, { hoursEstimated: "2.1250" }],
          [3, { hoursEstimated: "1.2500" }],
        ])
        expect(estimatedHours.element.value).toBe("1.2500")
      })

      test("when one field save fails and another succeeds, the failed edit remains visible and retryable", async () => {
        // Arrange
        const employeeWageTier = {
          id: 2,
          fiscalPeriodId: 1,
          tierLevel: 1,
          tierLabel: "Tier 1",
          wageRatePerHour: "20.00",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }
        const wageEnhancement = {
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
          hoursEstimated: "1.2500",
          hoursActual: "0.5000",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          employeeWageTier,
        }
        const policy = { show: true, create: true, update: true, destroy: true }
        vi.spyOn(employeeWageTiersApi, "get").mockResolvedValue({ employeeWageTier, policy })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        const updateWageEnhancement = vi
          .spyOn(wageEnhancementsApi, "update")
          .mockResolvedValue({ wageEnhancement: { ...wageEnhancement }, policy })
          .mockRejectedValueOnce(new Error("network unavailable"))
        const wrapper = mount(WageEnhancementTierTableBody, {
          props: {
            centreId: 1,
            employeeWageTierId: 2,
          },
          global: {
            plugins: [mockVuetify()],
          },
        })
        await flushPromises()
        const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
        const actualHours = wrapper.get<HTMLInputElement>('input[aria-label="Hours Actual"]')

        // Act
        await employeeName.setValue("Alexandra")
        await employeeName.trigger("blur")
        await flushPromises()
        const errorAfterNameFailure = wrapper.get('[role="alert"]').text()

        await actualHours.setValue("4.1250")
        await actualHours.trigger("blur")
        await flushPromises()
        const errorAfterHoursSave = wrapper.get('[role="alert"]').text()

        await wrapper.get('[title="Save"]').trigger("click")
        await flushPromises()

        // Assert
        expect(errorAfterNameFailure).toContain("network unavailable")
        expect(errorAfterHoursSave).toContain("network unavailable")
        expect(updateWageEnhancement.mock.calls).toEqual([
          [3, { employeeName: "Alexandra" }],
          [3, { hoursActual: "4.1250" }],
          [3, { employeeName: "Alexandra" }],
        ])
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
        expect(employeeName.element.value).toBe("Alexandra")
      })
    })
  })
})
