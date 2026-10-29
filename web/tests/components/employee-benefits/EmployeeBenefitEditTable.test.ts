import { flushPromises, mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import { employeeBenefitFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import EmployeeBenefitEditTable from "@/components/employee-benefits/EmployeeBenefitEditTable.vue"

describe("web/src/components/employee-benefits/EmployeeBenefitEditTable.vue", () => {
  describe("EmployeeBenefitEditTable", () => {
    describe("record editing", () => {
      test("when a typed save result is uncertain, blur does not replay the write", async () => {
        // Arrange
        const employeeBenefit = employeeBenefitFactory.build({
          id: 63,
          employerCostEstimated: "100.0000",
        })
        const policy = { show: true, create: true, update: true, destroy: true }
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
        const update = vi
          .spyOn(employeeBenefitsApi, "update")
          .mockRejectedValueOnce(
            new UnexpectedApiResponseError(
              { method: "put", url: "/api/employee-benefits/63" },
              502,
              new AxiosHeaders()
            )
          )
          .mockResolvedValue({ employeeBenefit, policy })
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 63 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')

        // Act
        await input.setValue("125")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()
        await input.trigger("blur")
        await flushPromises()

        // Assert
        expect(update).toHaveBeenCalledTimes(1)
      })

      test("when an uncertain save is reverted to the baseline, explicit retry saves that value", async () => {
        // Arrange
        const employeeBenefit = employeeBenefitFactory.build({
          id: 64,
          employerCostEstimated: "100.0000",
        })
        const policy = { show: true, create: true, update: true, destroy: true }
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
        const update = vi
          .spyOn(employeeBenefitsApi, "update")
          .mockRejectedValueOnce(
            new UnexpectedApiResponseError(
              { method: "put", url: "/api/employee-benefits/64" },
              502,
              new AxiosHeaders()
            )
          )
          .mockResolvedValue({ employeeBenefit, policy })
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 64 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')

        await input.setValue("125")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()
        await input.trigger("blur")
        await flushPromises()
        await input.setValue("100")
        await input.trigger("blur")
        await flushPromises()

        // Act
        await wrapper.get("td.text-right button").trigger("click")
        await flushPromises()

        // Assert
        expect(update).toHaveBeenNthCalledWith(2, 64, { employerCostEstimated: "100.0000" })
      })

      test("when a currency edit is committed with Enter, saves the four-decimal amount", async () => {
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
      })

      test("when failed loads are retried successfully, restores the selected record", async () => {
        // Arrange
        const employeeBenefit = employeeBenefitFactory.build({ id: 64 })
        const loadError = new Error("offline")
        const retryError = new Error("retry offline")
        const handleError = vi.fn()
        vi.spyOn(employeeBenefitsApi, "get")
          .mockRejectedValueOnce(loadError)
          .mockRejectedValueOnce(retryError)
          .mockResolvedValueOnce({
            employeeBenefit,
            policy: { show: true, create: true, update: true, destroy: true },
          })
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 64 },
          global: {
            plugins: [mockVuetify()],
            config: { errorHandler: handleError },
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.find('input[aria-label="Employer Cost Estimated"]').exists()).toBe(true)
      })

      test("when the initial load fails, reports its error to the app boundary", async () => {
        // Arrange
        const loadError = new Error("offline")
        const handleError = vi.fn()
        vi.spyOn(employeeBenefitsApi, "get").mockRejectedValueOnce(loadError)

        // Act
        mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 64 },
          global: {
            plugins: [mockVuetify()],
            config: { errorHandler: handleError },
          },
        })
        await flushPromises()

        // Assert
        expect(handleError.mock.calls[0]?.[0]).toBe(loadError)
      })

      test("when the retry after an initial load failure fails, reports the retry error to the app boundary", async () => {
        // Arrange
        const loadError = new Error("offline")
        const retryError = new Error("retry offline")
        const handleError = vi.fn()
        vi.spyOn(employeeBenefitsApi, "get")
          .mockRejectedValueOnce(loadError)
          .mockRejectedValueOnce(retryError)
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 64 },
          global: {
            plugins: [mockVuetify()],
            config: { errorHandler: handleError },
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(handleError.mock.calls[1]?.[0]).toBe(retryError)
      })

      test("when a failed autosave is retried slowly, shows the saving state", async () => {
        // Arrange
        const employeeBenefit = employeeBenefitFactory.build({ id: 62 })
        const retry =
          Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
          employeeBenefit,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        vi.spyOn(employeeBenefitsApi, "update")
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
        expect(
          wrapper.get('[aria-label="Saving employee benefits"]').attributes("aria-hidden")
        ).toBe("false")
      })

      test("when a failed autosave is retried slowly, keeps the failure visible", async () => {
        // Arrange
        const employeeBenefit = employeeBenefitFactory.build({ id: 62 })
        const retry =
          Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
          employeeBenefit,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        vi.spyOn(employeeBenefitsApi, "update")
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
        expect(wrapper.get('[role="alert"]').text()).toContain("offline")
      })

      test("when a committed revert is queued while saving, persists both edits in order", async () => {
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
        firstSave.resolve({ employeeBenefit, policy })
        await flushPromises()

        // Assert
        expect(update.mock.calls).toEqual([
          [41, { employerCostEstimated: "100.0000" }],
          [41, { employerCostEstimated: "120.0000" }],
        ])
      })

      test("when a newer edit is queued during a save, keeps the newer value visible", async () => {
        // Arrange
        const employeeBenefit = employeeBenefitFactory.build({
          id: 42,
          employerCostEstimated: "120.0000",
        })
        const firstSave =
          Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
          employeeBenefit,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        vi.spyOn(employeeBenefitsApi, "update").mockReturnValueOnce(firstSave.promise)
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 42 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        const input = wrapper.get<HTMLInputElement>('input[aria-label="Employer Cost Estimated"]')
        await input.setValue("100")
        await input.trigger("keydown", { key: "Enter" })
        await input.setValue("120")
        await input.trigger("keydown", { key: "Enter" })

        // Assert
        expect(input.element.value).toBe("$120.0000")
      })
    })
  })
})
