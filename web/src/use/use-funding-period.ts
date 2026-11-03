import { isCancel } from "axios"
import { type Ref, onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import { isNil } from "lodash"

import fundingPeriodsApi, {
  type FundingPeriodAsShow,
  type FundingPeriodPolicy,
} from "@/api/funding-periods-api"

export { type FundingPeriodAsShow }

export function useFundingPeriod(fundingPeriodId: Ref<number | null | undefined>) {
  const state = reactive<{
    fundingPeriod: FundingPeriodAsShow | null
    policy: FundingPeriodPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    fundingPeriod: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.fundingPeriod = null
    state.policy = null
    state.isLoading = false
    state.isErrored = false
  }

  async function fetch(): Promise<FundingPeriodAsShow | null> {
    const staticFundingPeriodId = unref(fundingPeriodId)

    if (isNil(staticFundingPeriodId)) {
      throw new Error("fundingPeriodId is required")
    }

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller

    state.isLoading = true
    try {
      const { fundingPeriod, policy } = await fundingPeriodsApi.get(staticFundingPeriodId, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || unref(fundingPeriodId) !== staticFundingPeriodId) {
        return state.fundingPeriod
      }

      state.isErrored = false
      state.fundingPeriod = fundingPeriod
      state.policy = policy
      return fundingPeriod
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.fundingPeriod

      console.error(`Failed to fetch funding period: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  async function save(): Promise<FundingPeriodAsShow> {
    const staticFundingPeriodId = unref(fundingPeriodId)

    if (isNil(staticFundingPeriodId)) {
      throw new Error("fundingPeriodId is required")
    }

    if (isNil(state.fundingPeriod)) {
      throw new Error("fundingPeriod is required")
    }

    state.isLoading = true
    try {
      const { fundingPeriod, policy } = await fundingPeriodsApi.update(
        staticFundingPeriodId,
        state.fundingPeriod
      )
      state.isErrored = false
      state.fundingPeriod = fundingPeriod
      state.policy = policy
      return fundingPeriod
    } catch (error) {
      console.error(`Failed to save funding period: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => unref(fundingPeriodId),
    async (newFundingPeriodId) => {
      clearRecord()
      if (isNil(newFundingPeriodId)) return

      await fetch()
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
    save,
  }
}

export default useFundingPeriod
