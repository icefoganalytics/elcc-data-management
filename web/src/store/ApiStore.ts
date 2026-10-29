import { defineStore, acceptHMRUpdate } from "pinia"
import { useAuth0 } from "@auth0/auth0-vue"
import { isAxiosError } from "axios"

import { useNotificationStore } from "@/store/NotificationStore"
import { SecureAPICall } from "@/store/helpers/axiosAPIConfig"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

// refs are reactive variables
// computed are reactive variables that are derived from other reactive variables
// functions are equivalent to methods/actions in vue2

export const useApiStore = defineStore("api", () => {
  const auth = useAuth0()

  const m = useNotificationStore()

  function doApiErrorMessage(err: unknown) {
    let status_code = 500
    let text = err instanceof Error ? err.message : "An unknown error occurred"

    if (isAxiosError<{ message?: string }>(err) && err.response) {
      status_code = err.response.status || 500
      if (err.response.data?.message) text = err.response.data.message
    }

    const message = {
      status_code: status_code,
      text,
      icon: "mdi-error",
      variant: "error",
      cause: err,
    }
    m.notify(message)
  }

  async function secureCall(method: string, url: string, data?: unknown) {
    let response
    /* if (!auth.isAuthenticated.value) {
      console.log("Not Authenticated");
      response = { error: "Not Authenticated" };
      return;
    } */
    response = await auth.getAccessTokenSilently().then(async (token) => {
      return await SecureAPICall(method, token)
        .request({ url, data })
        .then((res) => {
          return res.data
        })
        .catch((err) => {
          doApiErrorMessage(err)
          if (err instanceof UnexpectedApiResponseError) throw err
          return { error: err }
        })
    })

    return response
  }
  return {
    secureCall,
    doApiErrorMessage,
  }
})

// hot reloading for this store
if (import.meta.hot != null) {
  import.meta.hot.accept(acceptHMRUpdate(useApiStore, import.meta.hot))
}
