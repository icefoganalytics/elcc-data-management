import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"

import employeeBenefitsApi from "@/api/employee-benefits-api"

import { mockVuetify } from "@/tests/support"

import CurrencyInput from "@/components/CurrencyInput.vue"
import EmployeeBenefitEditTable from "@/components/employee-benefits/EmployeeBenefitEditTable.vue"

enableAutoUnmount(afterEach)

describe("web/src/components/employee-benefits/EmployeeBenefitEditTable.vue", () => {
  describe("EmployeeBenefitEditTable", () => {
    describe("autosave", () => {
      test("when a newer value is entered during a slow save, saves it without replacing the local edit", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 2026,
          grossPayrollMonthlyActual: "0.0000",
          grossPayrollMonthlyEstimated: "100.0000",
          costCapPercentage: "0.1000",
          employeeCostActual: "0.0000",
          employeeCostEstimated: "10.0000",
          employerCostActual: "0.0000",
          employerCostEstimated: "20.0000",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }
        const policy = { show: true, create: true, update: true, destroy: true }
        const staleResponse = { employeeBenefit: { ...employeeBenefit }, policy }
        const firstSave = Promise.withResolvers<void>()
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
        const updateEmployeeBenefit = vi
          .spyOn(employeeBenefitsApi, "update")
          .mockResolvedValue(staleResponse)
          .mockImplementationOnce(async () => {
            await firstSave.promise
            return staleResponse
          })
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 42 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const estimatedPayroll = wrapper
          .findAllComponents(CurrencyInput)
          .find((input) =>
            input.find('input[aria-label="Gross Payroll Monthly Estimated"]').exists()
          )
        if (!estimatedPayroll) {
          throw new Error("Expected the estimated payroll input to be rendered")
        }

        // Act
        estimatedPayroll.vm.$emit("update:modelValue", "101.0000")
        estimatedPayroll.vm.$emit("update:modelValue", "102.3456")
        firstSave.resolve()
        await flushPromises()

        // Assert
        expect(updateEmployeeBenefit.mock.calls).toEqual([
          [42, { grossPayrollMonthlyEstimated: "101.0000" }],
          [42, { grossPayrollMonthlyEstimated: "102.3456" }],
        ])
        expect(estimatedPayroll.props("modelValue")).toBe("102.3456")
      })

      test("when the value returns to its original value during a slow save, persists the revert", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 2026,
          grossPayrollMonthlyActual: "0.0000",
          grossPayrollMonthlyEstimated: "100.0000",
          costCapPercentage: "0.1000",
          employeeCostActual: "0.0000",
          employeeCostEstimated: "10.0000",
          employerCostActual: "0.0000",
          employerCostEstimated: "20.0000",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }
        const policy = { show: true, create: true, update: true, destroy: true }
        const staleResponse = { employeeBenefit: { ...employeeBenefit }, policy }
        const firstSave = Promise.withResolvers<void>()
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
        const updateEmployeeBenefit = vi
          .spyOn(employeeBenefitsApi, "update")
          .mockResolvedValue(staleResponse)
          .mockImplementationOnce(async () => {
            await firstSave.promise
            return staleResponse
          })
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 42 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const estimatedPayroll = wrapper
          .findAllComponents(CurrencyInput)
          .find((input) =>
            input.find('input[aria-label="Gross Payroll Monthly Estimated"]').exists()
          )
        if (!estimatedPayroll) {
          throw new Error("Expected the estimated payroll input to be rendered")
        }

        // Act
        estimatedPayroll.vm.$emit("update:modelValue", "101.0000")
        estimatedPayroll.vm.$emit("update:modelValue", "100.0000")
        firstSave.resolve()
        await flushPromises()

        // Assert
        expect(updateEmployeeBenefit.mock.calls).toEqual([
          [42, { grossPayrollMonthlyEstimated: "101.0000" }],
          [42, { grossPayrollMonthlyEstimated: "100.0000" }],
        ])
        expect(estimatedPayroll.props("modelValue")).toBe("100.0000")
      })

      test("when one save fails and another succeeds, shows the failure until retry succeeds", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 2026,
          grossPayrollMonthlyActual: "0.0000",
          grossPayrollMonthlyEstimated: "100.0000",
          costCapPercentage: "0.1000",
          employeeCostActual: "0.0000",
          employeeCostEstimated: "10.0000",
          employerCostActual: "0.0000",
          employerCostEstimated: "20.0000",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }
        const policy = { show: true, create: true, update: true, destroy: true }
        vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({ employeeBenefit, policy })
        const updateEmployeeBenefit = vi
          .spyOn(employeeBenefitsApi, "update")
          .mockResolvedValue({ employeeBenefit: { ...employeeBenefit }, policy })
          .mockRejectedValueOnce(new Error("network unavailable"))
        const wrapper = mount(EmployeeBenefitEditTable, {
          props: { employeeBenefitId: 42 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        const estimatedPayroll = wrapper
          .findAllComponents(CurrencyInput)
          .find((input) =>
            input.find('input[aria-label="Gross Payroll Monthly Estimated"]').exists()
          )
        if (!estimatedPayroll) {
          throw new Error("Expected the estimated payroll input to be rendered")
        }

        const actualPayroll = wrapper
          .findAllComponents(CurrencyInput)
          .find((input) => input.find('input[aria-label="Gross Payroll Monthly Actual"]').exists())
        if (!actualPayroll) {
          throw new Error("Expected the actual payroll input to be rendered")
        }

        // Act
        estimatedPayroll.vm.$emit("update:modelValue", "123.4567")
        await flushPromises()
        actualPayroll.vm.$emit("update:modelValue", "456.7891")
        await flushPromises()
        const failureMessage = wrapper.get('[role="alert"]').text()
        const retainedEstimatedPayroll = estimatedPayroll.props("modelValue")
        const retainedActualPayroll = actualPayroll.props("modelValue")

        await wrapper.get("button.bg-success").trigger("click")
        await flushPromises()

        // Assert
        expect(failureMessage).toContain("network unavailable")
        expect(retainedEstimatedPayroll).toBe("123.4567")
        expect(retainedActualPayroll).toBe("456.7891")
        expect(updateEmployeeBenefit).toHaveBeenLastCalledWith(42, {
          grossPayrollMonthlyEstimated: "123.4567",
        })
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
        expect(estimatedPayroll.props("modelValue")).toBe("123.4567")
      })
    })
  })
})
