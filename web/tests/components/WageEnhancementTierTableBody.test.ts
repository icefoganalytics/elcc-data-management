import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"
import { ref } from "vue"

import wageEnhancementsApi, {
  type WageEnhancementAsShow,
  type WageEnhancementPolicy,
} from "@/api/wage-enhancements-api"
import WageEnhancementTierTableBody from "@/components/wage-enhancements/WageEnhancementTierTableBody.vue"
import { mockVuetify } from "@/tests/support"

type WageEnhancementTestRow = {
  id: number
  centreId: number
  employeeWageTierId: number
  employeeName: string
  hoursEstimated: string
  hoursActual: string
}

const mocks = vi.hoisted(() => ({
  rows: [] as WageEnhancementTestRow[],
  update: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
}))

vi.mock("@/api/wage-enhancements-api", () => ({
  default: {
    update: mocks.update,
    delete: mocks.remove,
    create: mocks.create,
  },
}))

vi.mock("@/use/use-employee-wage-tier", () => ({
  default: () => ({
    employeeWageTier: ref({ tierLabel: "Tier 1", wageRatePerHour: "20.00" }),
  }),
}))

vi.mock("@/use/use-wage-enhancements", () => ({
  default: () => ({
    wageEnhancements: ref(mocks.rows),
    refresh: vi.fn(),
  }),
}))

vi.mock("@/use/use-snack", () => ({
  default: () => ({ success: vi.fn(), error: vi.fn() }),
}))

enableAutoUnmount(afterEach)

const updateWageEnhancement = vi.mocked(wageEnhancementsApi.update)

function mountWageEnhancementTable() {
  return mount(WageEnhancementTierTableBody, {
    props: {
      centreId: 1,
      employeeWageTierId: 2,
    },
    global: {
      plugins: [mockVuetify()],
    },
  })
}

type WageEnhancementUpdateResponse = {
  wageEnhancement: WageEnhancementAsShow
  policy: WageEnhancementPolicy
}

function createWageEnhancementUpdateResponse(): WageEnhancementUpdateResponse {
  return {
    wageEnhancement: {
      id: 3,
      centreId: 1,
      employeeWageTierId: 2,
      employeeName: "Alex",
      hoursEstimated: "1.2500",
      hoursActual: "0.5000",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      employeeWageTier: {
        id: 2,
        fiscalPeriodId: 1,
        tierLevel: 1,
        tierLabel: "Tier 1",
        wageRatePerHour: "20.00",
      },
    },
    policy: {
      show: true,
      create: true,
      update: true,
      destroy: true,
    },
  }
}

describe("web/src/components/wage-enhancements/WageEnhancementTierTableBody.vue", () => {
  describe("WageEnhancementTierTableBody autosave", () => {
    test("when a newer value is committed during a slow save, it is saved without replacing the input", async () => {
      // Arrange
      mocks.rows = [
        {
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
          hoursEstimated: "1.2500",
          hoursActual: "0.5000",
        },
      ]
      updateWageEnhancement.mockReset()
      const firstSave = Promise.withResolvers<WageEnhancementUpdateResponse>()
      updateWageEnhancement.mockImplementationOnce(() => firstSave.promise)
      updateWageEnhancement.mockResolvedValue(createWageEnhancementUpdateResponse())

      const wrapper = mountWageEnhancementTable()
      const estimatedHours = wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]')

      // Act
      await estimatedHours.setValue("2.1250")
      await estimatedHours.trigger("blur")
      await flushPromises()
      await estimatedHours.setValue("3.3750")
      await estimatedHours.trigger("blur")
      firstSave.resolve(createWageEnhancementUpdateResponse())
      await flushPromises()

      // Assert
      expect({
        updates: updateWageEnhancement.mock.calls.map(([id, attributes]) => [id, attributes]),
        inputValue: estimatedHours.element.value,
      }).toEqual({
        updates: [
          [3, { hoursEstimated: "2.1250" }],
          [3, { hoursEstimated: "3.3750" }],
        ],
        inputValue: "3.3750",
      })
    })

    test("when an input returns to its original value during a slow save, the original value is saved next", async () => {
      // Arrange
      mocks.rows = [
        {
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
          hoursEstimated: "1.2500",
          hoursActual: "0.5000",
        },
      ]
      updateWageEnhancement.mockReset()
      const firstSave = Promise.withResolvers<WageEnhancementUpdateResponse>()
      updateWageEnhancement.mockImplementationOnce(() => firstSave.promise)
      updateWageEnhancement.mockResolvedValue(createWageEnhancementUpdateResponse())

      const wrapper = mountWageEnhancementTable()
      const estimatedHours = wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]')

      // Act
      await estimatedHours.setValue("2.1250")
      await estimatedHours.trigger("blur")
      await flushPromises()
      await estimatedHours.setValue("1.2500")
      await estimatedHours.trigger("blur")
      firstSave.resolve(createWageEnhancementUpdateResponse())
      await flushPromises()

      // Assert
      expect({
        updates: updateWageEnhancement.mock.calls.map(([id, attributes]) => [id, attributes]),
        inputValue: estimatedHours.element.value,
      }).toEqual({
        updates: [
          [3, { hoursEstimated: "2.1250" }],
          [3, { hoursEstimated: "1.2500" }],
        ],
        inputValue: "1.2500",
      })
    })

    test("when one field save fails and another succeeds, the failed edit remains visible and retryable", async () => {
      // Arrange
      mocks.rows = [
        {
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
          hoursEstimated: "1.2500",
          hoursActual: "0.5000",
        },
      ]
      updateWageEnhancement.mockReset()
      updateWageEnhancement.mockRejectedValueOnce(new Error("network unavailable"))
      updateWageEnhancement.mockResolvedValue(createWageEnhancementUpdateResponse())

      const wrapper = mountWageEnhancementTable()
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
      expect({
        updates: updateWageEnhancement.mock.calls.map(([id, attributes]) => [id, attributes]),
        errorAfterNameFailure,
        errorAfterHoursSave,
        remainingError: wrapper.find('[role="alert"]').exists(),
        employeeName: employeeName.element.value,
      }).toEqual({
        updates: [
          [3, { employeeName: "Alexandra" }],
          [3, { hoursActual: "4.1250" }],
          [3, { employeeName: "Alexandra" }],
        ],
        errorAfterNameFailure: expect.stringContaining("network unavailable"),
        errorAfterHoursSave: expect.stringContaining("network unavailable"),
        remainingError: false,
        employeeName: "Alexandra",
      })
    })
  })
})
