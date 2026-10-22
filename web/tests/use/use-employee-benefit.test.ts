import { effectScope, ref, type EffectScope } from "vue"
import { flushPromises } from "@vue/test-utils"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import { employeeBenefitFactory } from "@/tests/factories"
import useEmployeeBenefit from "@/use/use-employee-benefit"

type BenefitResponse = Awaited<ReturnType<typeof employeeBenefitsApi.get>>

let scope: EffectScope
beforeEach(() => {
  scope = effectScope()
})
afterEach(() => {
  scope.stop()
})

describe("web/src/use/use-employee-benefit.ts", () => {
  describe("record changes", () => {
    test("when an earlier load finishes while the selected record is loading, keeps the editor loading without stale data", async () => {
      // Arrange
      const firstLoad = Promise.withResolvers<BenefitResponse>()
      const selectedLoad = Promise.withResolvers<BenefitResponse>()
      const record = employeeBenefitFactory.build({ id: 41 })
      vi.spyOn(employeeBenefitsApi, "get")
        .mockReturnValueOnce(firstLoad.promise)
        .mockReturnValueOnce(selectedLoad.promise)
      const id = ref<number | undefined>(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")

      // Act
      id.value = 42
      firstLoad.resolve({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      await flushPromises()

      // Assert
      expect(benefit.isLoading.value).toBe(true)
      expect(benefit.employeeBenefit.value).toBeNull()
    })

    test("when an earlier response arrives after the selected record loads, retains the selected record", async () => {
      // Arrange
      const firstLoad = Promise.withResolvers<BenefitResponse>()
      const record1 = employeeBenefitFactory.build({ id: 41 })
      const record2 = employeeBenefitFactory.build({ id: 42 })
      vi.spyOn(employeeBenefitsApi, "get")
        .mockReturnValueOnce(firstLoad.promise)
        .mockResolvedValueOnce({
          employeeBenefit: record2,
          policy: { show: true, create: true, update: true, destroy: true },
        })
      const id = ref(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")

      // Act
      id.value = 42
      await flushPromises()
      firstLoad.resolve({
        employeeBenefit: record1,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      await flushPromises()

      // Assert
      expect(benefit.employeeBenefit.value).toEqual(record2)
      expect(benefit.isLoading.value).toBe(false)
    })

    test("when a committed revert is queued before leaving a month, saves it after the in-flight write", async () => {
      // Arrange
      const record = employeeBenefitFactory.build({ id: 41, employerCostEstimated: "120.0000" })
      const firstSave = Promise.withResolvers<BenefitResponse>()
      vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      const update = vi
        .spyOn(employeeBenefitsApi, "update")
        .mockReturnValueOnce(firstSave.promise)
        .mockResolvedValue({
          employeeBenefit: record,
          policy: { show: true, create: true, update: true, destroy: true },
        })
      const id = ref<number | undefined>(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")
      await flushPromises()

      // Act
      benefit.updateAttribute("employerCostEstimated", "100.0000")
      benefit.updateAttribute("employerCostEstimated", "120.0000")
      id.value = undefined
      id.value = 41
      await flushPromises()
      firstSave.resolve({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      await flushPromises()

      // Assert
      expect(update.mock.calls).toEqual([
        [41, { employerCostEstimated: "100.0000" }],
        [41, { employerCostEstimated: "120.0000" }],
      ])
      expect(benefit.employeeBenefit.value?.employerCostEstimated).toBe("120.0000")
      expect(benefit.isSaving.value).toBe(false)
    })

    test("when an earlier save finishes after returning but before the next edit, persists a revert to the loaded value", async () => {
      // Arrange
      const record = employeeBenefitFactory.build({ id: 41, employerCostEstimated: "120.0000" })
      const firstSave = Promise.withResolvers<BenefitResponse>()
      vi.spyOn(employeeBenefitsApi, "get").mockResolvedValue({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      const update = vi
        .spyOn(employeeBenefitsApi, "update")
        .mockReturnValueOnce(firstSave.promise)
        .mockResolvedValue({
          employeeBenefit: record,
          policy: { show: true, create: true, update: true, destroy: true },
        })
      const id = ref<number | undefined>(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")
      await flushPromises()

      // Act
      benefit.updateAttribute("employerCostEstimated", "100.0000")
      id.value = undefined
      id.value = 41
      await flushPromises()
      firstSave.resolve({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      await flushPromises()
      benefit.updateAttribute("employerCostEstimated", "120.0000")
      await benefit.save()

      // Assert
      expect(update.mock.calls).toEqual([
        [41, { employerCostEstimated: "100.0000" }],
        [41, { employerCostEstimated: "120.0000" }],
      ])
    })

    test("when an earlier save finishes during the return load, preserves its acknowledgement for subsequent edits", async () => {
      // Arrange
      const record = employeeBenefitFactory.build({ id: 41, employerCostEstimated: "120.0000" })
      const firstSave = Promise.withResolvers<BenefitResponse>()
      const returnLoad = Promise.withResolvers<BenefitResponse>()
      vi.spyOn(employeeBenefitsApi, "get")
        .mockResolvedValueOnce({
          employeeBenefit: record,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        .mockReturnValueOnce(returnLoad.promise)
      const update = vi
        .spyOn(employeeBenefitsApi, "update")
        .mockReturnValueOnce(firstSave.promise)
        .mockResolvedValue({
          employeeBenefit: record,
          policy: { show: true, create: true, update: true, destroy: true },
        })
      const id = ref<number | undefined>(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")
      await flushPromises()

      // Act
      benefit.updateAttribute("employerCostEstimated", "100.0000")
      id.value = undefined
      id.value = 41
      firstSave.resolve({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      await flushPromises()
      returnLoad.resolve({
        employeeBenefit: record,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      await flushPromises()
      benefit.updateAttribute("employerCostEstimated", "120.0000")
      await benefit.save()

      // Assert
      expect(update.mock.calls).toEqual([
        [41, { employerCostEstimated: "100.0000" }],
        [41, { employerCostEstimated: "120.0000" }],
      ])
    })

    test("when a save and revert both finish during a return load, rejects an intermediate server value", async () => {
      // Arrange
      const record = employeeBenefitFactory.build({ id: 41, employerCostEstimated: "120.0000" })
      const intermediateRecord = employeeBenefitFactory.build({
        ...record,
        employerCostEstimated: "100.0000",
      })
      const policy = { show: true, create: true, update: true, destroy: true }
      const firstSave = Promise.withResolvers<BenefitResponse>()
      const returnLoad = Promise.withResolvers<BenefitResponse>()
      vi.spyOn(employeeBenefitsApi, "get")
        .mockResolvedValueOnce({ employeeBenefit: record, policy })
        .mockReturnValueOnce(returnLoad.promise)
      vi.spyOn(employeeBenefitsApi, "update")
        .mockReturnValueOnce(firstSave.promise)
        .mockResolvedValue({ employeeBenefit: record, policy })
      const id = ref<number | undefined>(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")
      await flushPromises()

      // Act
      benefit.updateAttribute("employerCostEstimated", "100.0000")
      benefit.updateAttribute("employerCostEstimated", "120.0000")
      id.value = undefined
      id.value = 41
      firstSave.resolve({ employeeBenefit: intermediateRecord, policy })
      await flushPromises()
      returnLoad.resolve({ employeeBenefit: intermediateRecord, policy })
      await flushPromises()

      // Assert
      expect(benefit.employeeBenefit.value?.employerCostEstimated).toBe("120.0000")
    })

    test("when loading fails, reports the error without retaining an editable previous record", async () => {
      // Arrange
      const record = employeeBenefitFactory.build({ id: 41 })
      vi.spyOn(employeeBenefitsApi, "get")
        .mockResolvedValueOnce({
          employeeBenefit: record,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        .mockRejectedValueOnce(new Error("offline"))
      const id = ref(41)
      const benefit = scope.run(() => useEmployeeBenefit(id))
      if (!benefit) throw new Error("Expected an active benefit editor")
      await flushPromises()

      // Act
      id.value = 42
      await flushPromises()

      // Assert
      expect(benefit.employeeBenefit.value).toBeNull()
      expect(benefit.isErrored.value).toBe(true)
      expect(benefit.isLoading.value).toBe(false)
    })
  })
})
