import { flushPromises, mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"

import employeeWageTiersApi from "@/api/employee-wage-tiers-api"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import wageEnhancementsApi, {
  type WageEnhancementAsShow,
  type WageEnhancementPolicy,
} from "@/api/wage-enhancements-api"

import { employeeWageTierFactory, wageEnhancementFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import WageEnhancementsEditTable from "@/components/wage-enhancements/WageEnhancementsEditTable.vue"

vi.mock("@/use/use-snack", () => ({
  default: () => ({ success: vi.fn(), error: vi.fn() }),
}))

describe("web/src/components/wage-enhancements/WageEnhancementsEditTable.vue", () => {
  describe("WageEnhancementsEditTable", () => {
    describe("interrupted saves", () => {
      test("when Enter is followed by blur after an uncertain response, sends only one write", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
        })
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
          .mockRejectedValue(
            new UnexpectedApiResponseError(
              { method: "put", url: "/api/wage-enhancements/3" },
              502,
              new AxiosHeaders()
            )
          )
        const wrapper = mount(WageEnhancementsEditTable, {
          props: { centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')

        // Act
        await employeeName.setValue("Alexandra")
        await employeeName.trigger("keydown", { key: "Enter" })
        await flushPromises()
        await employeeName.trigger("blur")
        await flushPromises()

        // Assert
        expect(update).toHaveBeenCalledTimes(1)
      })

      test("when the user explicitly retries an interrupted save, submits the retained draft", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
        })
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
          .mockRejectedValueOnce(
            new UnexpectedApiResponseError(
              { method: "put", url: "/api/wage-enhancements/3" },
              502,
              new AxiosHeaders()
            )
          )
          .mockResolvedValue({ wageEnhancement, policy })
        const wrapper = mount(WageEnhancementsEditTable, {
          props: { centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const employeeName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
        await employeeName.setValue("Alexandra")
        await employeeName.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Act
        await wrapper.get('[aria-label="Retry saving employee"]').trigger("click")
        await flushPromises()

        // Assert
        expect(update).toHaveBeenNthCalledWith(2, 3, {
          employeeName: "Alexandra",
          hoursEstimated: "0.00",
          hoursActual: "0.00",
        })
      })
    })

    describe("employee editing", () => {
      test("when hours are committed, saves both hour fields at database precision", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
        })
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        const update = vi.spyOn(wageEnhancementsApi, "update").mockResolvedValue({
          wageEnhancement,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        const wrapper = mount(WageEnhancementsEditTable, {
          props: { centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get('input[aria-label="Hours Actual"]').setValue("2.345")
        const estimatedHours = wrapper.get('input[aria-label="Hours Estimated"]')
        await estimatedHours.setValue("1.239")
        await estimatedHours.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(update).toHaveBeenCalledWith(3, {
          employeeName: "Alex",
          hoursEstimated: "1.24",
          hoursActual: "2.35",
        })
      })

      test("when committed hours have excess precision, displays the total from rounded hours", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({
          id: 2,
          fiscalPeriodId: 1,
          wageRatePerHour: "20.0000",
        })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
        })
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "update").mockResolvedValue({
          wageEnhancement: { ...wageEnhancement, hoursEstimated: "1.24" },
          policy: { show: true, create: true, update: true, destroy: true },
        })
        const wrapper = mount(WageEnhancementsEditTable, {
          props: { centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        const estimatedHours = wrapper.get('input[aria-label="Hours Estimated"]')
        await estimatedHours.setValue("1.239")
        await estimatedHours.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(
          wrapper.get<HTMLInputElement>('input[aria-label="Wage Enhancement Total Estimated"]')
            .element.value
        ).toBe("$24.80")
      })

      test("when a trailing blur arrives after deletion starts, does not send a new save", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: 2,
          employeeName: "Alex",
        })
        const deletion = Promise.withResolvers<void>()
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "delete").mockReturnValueOnce(deletion.promise)
        const update = vi.spyOn(wageEnhancementsApi, "update").mockResolvedValue({
          wageEnhancement,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        const wrapper = mount(WageEnhancementsEditTable, {
          props: { centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const employeeName = wrapper.get('input[aria-label="Employee Name"]')
        await employeeName.setValue("Alexandra")

        // Act
        await wrapper.get('[title="Delete"]').trigger("click")
        await employeeName.trigger("blur")
        await flushPromises()

        // Assert
        expect(update).not.toHaveBeenCalled()
      })

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
          [3, { employeeName: "Alex", hoursEstimated: "2.13", hoursActual: "0.50" }],
          [3, { employeeName: "Alex", hoursEstimated: "3.38", hoursActual: "0.50" }],
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
        expect(
          wrapper.get<HTMLInputElement>('input[aria-label="Hours Estimated"]').element.value
        ).toBe("3.38")
      })

      test("when a failed save is retried while pending, keeps the failure visible", async () => {
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
        const retry =
          Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
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
      })

      test("when a failed save is retried while pending, retains the edited employee name", async () => {
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
        const retry =
          Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
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
        const retainedName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
        expect(retainedName.element.value).toBe("Alexandra")
      })

      test("when a failed save is retried successfully, clears the failure", async () => {
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
      })

      test("when a failed save is retried successfully, retains the edited employee name", async () => {
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

        // Act
        const employeeName = wrapper.get('input[aria-label="Employee Name"]')
        await employeeName.setValue("Alexandra")
        await employeeName.trigger("blur")
        await flushPromises()
        await wrapper.get('[aria-label="Retry saving employee"]').trigger("click")
        await flushPromises()

        // Assert
        const savedName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
        expect(savedName.element.value).toBe("Alexandra")
      })

      test("when an employee is created, adds one editable row", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "",
        })
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [],
          totalCount: 0,
        })
        vi.spyOn(wageEnhancementsApi, "create").mockResolvedValue({
          wageEnhancement,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        const wrapper = mount(WageEnhancementsEditTable, {
          props: { centreId: 1, fiscalPeriodId: 1 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get('[title="Add employee"]').trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.findAll('input[aria-label="Employee Name"]')).toHaveLength(1)
      })

      test("when an edit reverts while its save is pending, saves both values in order", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "Alex",
        })
        const firstSave = Promise.withResolvers<{
          wageEnhancement: WageEnhancementAsShow
          policy: WageEnhancementPolicy
        }>()
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
        firstSave.resolve({
          wageEnhancement,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        await flushPromises()

        // Assert
        expect(update.mock.calls).toEqual([
          [3, { employeeName: "Alexandra", hoursEstimated: "0.00", hoursActual: "0.00" }],
          [3, { employeeName: "Alex", hoursEstimated: "0.00", hoursActual: "0.00" }],
        ])
      })

      test("when an edit reverts while its save is pending, shows the reverted name after saving", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "Alex",
        })
        const firstSave = Promise.withResolvers<{
          wageEnhancement: WageEnhancementAsShow
          policy: WageEnhancementPolicy
        }>()
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
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
        firstSave.resolve({
          wageEnhancement,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        await flushPromises()

        // Assert
        const savedName = wrapper.get<HTMLInputElement>('input[aria-label="Employee Name"]')
        expect(savedName.element.value).toBe("Alex")
      })

      test("when a save fails after a row is edited and another row is created, keeps both rows editable", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "Alex",
        })
        const createdWageEnhancement = wageEnhancementFactory.build({
          id: 5,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "",
        })
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "update").mockRejectedValue(new Error("offline"))
        vi.spyOn(wageEnhancementsApi, "create").mockResolvedValue({
          wageEnhancement: createdWageEnhancement,
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
        await flushPromises()
        await wrapper.get('[title="Add employee"]').trigger("click")
        await flushPromises()

        // Assert
        const employeeNames = wrapper
          .findAll<HTMLInputElement>('input[aria-label="Employee Name"]')
          .map((input) => input.element.value)
        expect(employeeNames).toEqual(["Alexandra", ""])
      })

      test("when another row is created after a failed save, keeps the save failure visible", async () => {
        // Arrange
        const employeeWageTier = employeeWageTierFactory.build({ id: 2, fiscalPeriodId: 1 })
        const wageEnhancement = wageEnhancementFactory.build({
          id: 3,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "Alex",
        })
        const createdWageEnhancement = wageEnhancementFactory.build({
          id: 5,
          centreId: 1,
          employeeWageTierId: employeeWageTier.id,
          employeeName: "",
        })
        vi.spyOn(employeeWageTiersApi, "list").mockResolvedValue({
          employeeWageTiers: [employeeWageTier],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "list").mockResolvedValue({
          wageEnhancements: [wageEnhancement],
          totalCount: 1,
        })
        vi.spyOn(wageEnhancementsApi, "update").mockRejectedValue(new Error("offline"))
        vi.spyOn(wageEnhancementsApi, "create").mockResolvedValue({
          wageEnhancement: createdWageEnhancement,
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
        await flushPromises()
        await wrapper.get('[title="Add employee"]').trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get('[role="alert"]').text()).toContain("offline")
      })
    })
  })
})
