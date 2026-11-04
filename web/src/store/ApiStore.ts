import { defineStore, acceptHMRUpdate } from "pinia"
import { useAuth0 } from "@auth0/auth0-vue"
import { SecureAPICall } from "@/store/helpers/axiosAPIConfig"
import { AuthenticationRequiredError } from "@/api/errors/authentication-required-error"

// refs are reactive variables
// computed are reactive variables that are derived from other reactive variables
// functions are equivalent to methods/actions in vue2

export const useApiStore = defineStore("api", () => {
  const auth = useAuth0()

  async function secureCall(method: string, url: string, data?: unknown) {
    let token: string
    try {
      token = await auth.getAccessTokenSilently()
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "error" in error &&
        error.error === "login_required"
      ) {
        throw new AuthenticationRequiredError()
      }

      throw error
    }
    const response = await SecureAPICall(method, token).request({ url, data })
    return response.data
  }
  return {
    secureCall,
  }
})

// hot reloading for this store
if (import.meta.hot != null) {
  import.meta.hot.accept(acceptHMRUpdate(useApiStore, import.meta.hot))
}
