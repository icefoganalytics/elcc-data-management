import { effectScope, ref, type EffectScope } from "vue"
import { flushPromises } from "@vue/test-utils"
import { isUndefined } from "lodash"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import useEmployeeBenefit from "@/use/use-employee-benefit"

let scope: EffectScope
beforeEach(() => {
  scope = effectScope()
})
afterEach(() => {
  scope.stop()
})

describe("web/src/use/use-employee-benefit.ts", () => {
  describe("useEmployeeBenefit", () => {
    describe("record changes", () => {
      test("when an earlier load finishes while the selected record is loading, keeps the editor loading without stale data", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 1,
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
        const firstLoad = Promise.withResolvers<void>()
        const secondLoad = Promise.withResolvers<void>()
        vi.spyOn(employeeBenefitsApi, "get")
          .mockImplementationOnce(async () => {
            await firstLoad.promise
            return { employeeBenefit, policy }
          })
          .mockImplementationOnce(async () => {
            await secondLoad.promise
            return { employeeBenefit: { ...employeeBenefit, id: 43, fiscalPeriodId: 2 }, policy }
          })
        const employeeBenefitId = ref<number | null>(42)
        const benefit = scope.run(() => useEmployeeBenefit(employeeBenefitId))
        if (isUndefined(benefit)) {
          throw new Error("Expected the benefit composable to start")
        }

        // Act
        employeeBenefitId.value = 43
        await flushPromises()
        firstLoad.resolve()
        await flushPromises()

        // Assert
        expect(benefit.isLoading.value).toBe(true)
        expect(benefit.employeeBenefit.value).toBeNull()
      })

      test("when an earlier response arrives after the selected record loads, retains the selected record", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 1,
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
        const firstLoad = Promise.withResolvers<void>()
        const selectedBenefit = { ...employeeBenefit, id: 43, fiscalPeriodId: 2 }
        vi.spyOn(employeeBenefitsApi, "get")
          .mockImplementationOnce(async () => {
            await firstLoad.promise
            return { employeeBenefit, policy }
          })
          .mockResolvedValueOnce({ employeeBenefit: selectedBenefit, policy })
        const employeeBenefitId = ref<number | null>(42)
        const benefit = scope.run(() => useEmployeeBenefit(employeeBenefitId))
        if (isUndefined(benefit)) {
          throw new Error("Expected the benefit composable to start")
        }

        // Act
        employeeBenefitId.value = 43
        await flushPromises()
        firstLoad.resolve()
        await flushPromises()

        // Assert
        expect(benefit.employeeBenefit.value).toEqual(selectedBenefit)
      })

      test("when returning to a record with an unfinished save, persists the new edit after the earlier write", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 1,
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
        const firstSave = Promise.withResolvers<void>()
        vi.spyOn(employeeBenefitsApi, "get")
          .mockResolvedValueOnce({ employeeBenefit: { ...employeeBenefit }, policy })
          .mockResolvedValueOnce({
            employeeBenefit: { ...employeeBenefit, id: 43, fiscalPeriodId: 2 },
            policy,
          })
          .mockResolvedValueOnce({ employeeBenefit: { ...employeeBenefit }, policy })
        const updateEmployeeBenefit = vi
          .spyOn(employeeBenefitsApi, "update")
          .mockResolvedValue({ employeeBenefit, policy })
          .mockImplementationOnce(async () => {
            await firstSave.promise
            return { employeeBenefit, policy }
          })
        const employeeBenefitId = ref<number | null>(42)
        const benefit = scope.run(() => useEmployeeBenefit(employeeBenefitId))
        if (isUndefined(benefit)) {
          throw new Error("Expected the benefit composable to start")
        }
        await flushPromises()

        // Act
        benefit.updateAttribute("grossPayrollMonthlyEstimated", "101.0000")
        employeeBenefitId.value = 43
        await flushPromises()
        employeeBenefitId.value = 42
        await flushPromises()
        benefit.updateAttribute("grossPayrollMonthlyEstimated", "100.0000")
        const writesBeforeCompletion = updateEmployeeBenefit.mock.calls.slice()
        firstSave.resolve()
        await flushPromises()
        await benefit.save()

        // Assert
        expect(writesBeforeCompletion).toEqual([[42, { grossPayrollMonthlyEstimated: "101.0000" }]])
        expect(updateEmployeeBenefit.mock.calls).toEqual([
          [42, { grossPayrollMonthlyEstimated: "101.0000" }],
          [42, { grossPayrollMonthlyEstimated: "100.0000" }],
        ])
        expect(benefit.employeeBenefit.value?.grossPayrollMonthlyEstimated).toBe("100.0000")
      })

      test("when loading fails, reports the error without retaining an editable previous record", async () => {
        // Arrange
        const employeeBenefit = {
          id: 42,
          centreId: 4,
          fiscalPeriodId: 1,
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
        vi.spyOn(employeeBenefitsApi, "get")
          .mockResolvedValueOnce({ employeeBenefit, policy })
          .mockRejectedValueOnce(new Error("network unavailable"))
        const employeeBenefitId = ref<number | null>(42)
        const benefit = scope.run(() => useEmployeeBenefit(employeeBenefitId))
        if (isUndefined(benefit)) {
          throw new Error("Expected the benefit composable to start")
        }
        await flushPromises()

        // Act
        employeeBenefitId.value = 43
        await flushPromises()

        // Assert
        expect(benefit.isErrored.value).toBe(true)
        expect(benefit.isLoading.value).toBe(false)
        expect(benefit.employeeBenefit.value).toBeNull()
      })
    })
  })
})
