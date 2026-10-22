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
  test("when an earlier load finishes while the selected record is loading, keeps the editor loading without stale data", async () => {
    // Arrange
    const firstLoad = Promise.withResolvers<BenefitResponse>()
    const selectedLoad = Promise.withResolvers<BenefitResponse>()
    const employeeBenefit = employeeBenefitFactory.build({ id: 41 })
    vi.spyOn(employeeBenefitsApi, "get")
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(selectedLoad.promise)
    const id = ref<number | undefined>(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")

    // Act
    id.value = 42
    firstLoad.resolve({
      employeeBenefit,
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
    const employeeBenefit1 = employeeBenefitFactory.build({ id: 41 })
    const employeeBenefit2 = employeeBenefitFactory.build({ id: 42 })
    vi.spyOn(employeeBenefitsApi, "get")
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({
        employeeBenefit: employeeBenefit2,
        policy: { show: true, create: true, update: true, destroy: true },
      })
    const id = ref(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")

    // Act
    id.value = 42
    await flushPromises()
    firstLoad.resolve({
      employeeBenefit: employeeBenefit1,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    await flushPromises()

    // Assert
    expect(benefit.employeeBenefit.value).toEqual(employeeBenefit2)
    expect(benefit.isLoading.value).toBe(false)
  })

  test("when loading fails, reports the error without retaining an editable previous record", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({ id: 41 })
    vi.spyOn(employeeBenefitsApi, "get")
      .mockResolvedValueOnce({
        employeeBenefit,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      .mockRejectedValueOnce(new Error("offline"))
    const id = ref(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")
    await flushPromises()

    // Act
    id.value = 42
    await flushPromises()

    // Assert
    expect(benefit.employeeBenefit.value).toBeNull()
    expect(benefit.isErrored.value).toBe(true)
    expect(benefit.isLoading.value).toBe(false)
  })

  test("when a save finishes after another record loads, retains the selected record", async () => {
    // Arrange
    const employeeBenefit1 = employeeBenefitFactory.build({ id: 41 })
    const employeeBenefit2 = employeeBenefitFactory.build({ id: 42 })
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof employeeBenefitsApi.update>>>()
    const policy = { show: true, create: true, update: true, destroy: true }
    vi.spyOn(employeeBenefitsApi, "get")
      .mockResolvedValueOnce({ employeeBenefit: employeeBenefit1, policy })
      .mockResolvedValueOnce({ employeeBenefit: employeeBenefit2, policy })
    vi.spyOn(employeeBenefitsApi, "update").mockReturnValueOnce(firstSave.promise)
    const id = ref(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")
    await flushPromises()

    // Act
    const save = benefit.save()
    id.value = 42
    await flushPromises()
    firstSave.resolve({ employeeBenefit: employeeBenefit1, policy })
    await save

    // Assert
    expect(benefit.employeeBenefit.value).toEqual(employeeBenefit2)
    expect(benefit.isLoading.value).toBe(false)
  })
})
