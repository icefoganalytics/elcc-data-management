import { CanceledError } from "axios"
import { effectScope, ref, type EffectScope } from "vue"
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils"

import employeeBenefitsApi from "@/api/employee-benefits-api"
import { employeeBenefitFactory } from "@/tests/factories"
import useEmployeeBenefit from "@/use/use-employee-benefit"

type BenefitResponse = Awaited<ReturnType<typeof employeeBenefitsApi.get>>

enableAutoUnmount(afterEach)

let scope: EffectScope

beforeEach(() => {
  scope = effectScope()
})

afterEach(() => {
  scope.stop()
})

describe("web/src/use/use-employee-benefit.ts", () => {
  test("when the selected month changes twice in one update, loads only the final selection", async () => {
    // Arrange
    const firstLoad = Promise.withResolvers<BenefitResponse>()
    const firstBenefit = employeeBenefitFactory.build({ id: 41 })
    const selectedBenefit = employeeBenefitFactory.build({ id: 43 })
    const policy = { show: true, create: true, update: true, destroy: true }
    const get = vi
      .spyOn(employeeBenefitsApi, "get")
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({ employeeBenefit: selectedBenefit, policy })
    const id = ref(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")

    // Act
    id.value = 42
    id.value = 43
    await flushPromises()
    firstLoad.resolve({ employeeBenefit: firstBenefit, policy })
    await flushPromises()

    // Assert
    expect(get.mock.calls.map(([recordId]) => recordId)).toEqual([41, 43])
    expect(benefit.employeeBenefit.value).toEqual(selectedBenefit)
    expect(benefit.isLoading.value).toBe(false)
    expect(benefit.isErrored.value).toBe(false)
  })

  test("when an earlier load finishes while the selected record is loading, keeps the editor loading without stale data", async () => {
    // Arrange
    const firstLoad = Promise.withResolvers<BenefitResponse>()
    const selectedLoad = Promise.withResolvers<BenefitResponse>()
    const employeeBenefit = employeeBenefitFactory.build({ id: 41 })
    const get = vi
      .spyOn(employeeBenefitsApi, "get")
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(selectedLoad.promise)
    const id = ref<number | undefined>(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")
    const firstSignal = get.mock.calls[0]?.[1]?.signal

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
    expect(firstSignal?.aborted).toBe(true)
  })

  test("when a superseded read rejects with cancellation, keeps the selected record without an error", async () => {
    // Arrange
    const firstLoad = Promise.withResolvers<BenefitResponse>()
    const employeeBenefit = employeeBenefitFactory.build({ id: 42 })
    const policy = { show: true, create: true, update: true, destroy: true }
    const get = vi
      .spyOn(employeeBenefitsApi, "get")
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({ employeeBenefit, policy })
    const id = ref(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")
    const firstSignal = get.mock.calls[0]?.[1]?.signal

    // Act
    id.value = 42
    await flushPromises()
    firstLoad.reject(new CanceledError("Request canceled"))
    await flushPromises()

    // Assert
    expect(firstSignal?.aborted).toBe(true)
    expect(benefit.employeeBenefit.value).toEqual(employeeBenefit)
    expect(benefit.isErrored.value).toBe(false)
    expect(benefit.isLoading.value).toBe(false)
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

  test("when its scope is disposed, aborts the active read without recording a failure", async () => {
    // Arrange
    const pendingLoad = Promise.withResolvers<BenefitResponse>()
    const get = vi.spyOn(employeeBenefitsApi, "get").mockReturnValueOnce(pendingLoad.promise)
    const id = ref(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")
    const signal = get.mock.calls[0]?.[1]?.signal

    // Act
    scope.stop()
    pendingLoad.reject(new CanceledError("Request canceled"))
    await flushPromises()

    // Assert
    expect(signal?.aborted).toBe(true)
    expect(benefit.isErrored.value).toBe(false)
  })

  test("when the selected id becomes undefined, clears state and aborts the pending read", async () => {
    // Arrange
    const pendingLoad = Promise.withResolvers<BenefitResponse>()
    const get = vi.spyOn(employeeBenefitsApi, "get").mockReturnValueOnce(pendingLoad.promise)
    const id = ref<number | undefined>(41)
    const benefit = scope.run(() => useEmployeeBenefit(id))
    if (!benefit) throw new Error("Expected an active benefit model")
    const signal = get.mock.calls[0]?.[1]?.signal

    // Act
    id.value = undefined
    pendingLoad.reject(new CanceledError("Request canceled"))
    await flushPromises()

    // Assert
    expect(signal?.aborted).toBe(true)
    expect(benefit.employeeBenefit.value).toBeNull()
    expect(benefit.policy.value).toBeNull()
    expect(benefit.isLoading.value).toBe(false)
    expect(benefit.isErrored.value).toBe(false)
  })

  test("when loading fails, reports the error without retaining an editable previous record", async () => {
    // Arrange
    const employeeBenefit = employeeBenefitFactory.build({ id: 41 })
    const loadError = new Error("offline")
    const handleError = vi.fn()
    vi.spyOn(employeeBenefitsApi, "get")
      .mockResolvedValueOnce({
        employeeBenefit,
        policy: { show: true, create: true, update: true, destroy: true },
      })
      .mockRejectedValueOnce(loadError)
    const id = ref(41)
    const wrapper = mount(
      {
        setup: () => useEmployeeBenefit(id),
        render: () => null,
      },
      { global: { config: { errorHandler: handleError } } }
    )
    await flushPromises()

    // Act
    id.value = 42
    await flushPromises()

    // Assert
    expect(wrapper.vm.employeeBenefit).toBeNull()
    expect(wrapper.vm.isErrored).toBe(true)
    expect(wrapper.vm.isLoading).toBe(false)
    expect(handleError.mock.calls.map(([error]) => error)).toEqual([loadError])
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
