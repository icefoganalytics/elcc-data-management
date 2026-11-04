import { reactive, toRefs } from "vue"

import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

const state = reactive({
  error: CloudflareChallengeError.NONE,
})

export function useCloudflareChallenge() {
  function reset() {
    state.error = CloudflareChallengeError.NONE
  }

  return {
    ...toRefs(state),
    reset,
  }
}

export default useCloudflareChallenge
