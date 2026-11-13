import { AUTH0_INJECTION_KEY, type Auth0VueClient } from "@auth0/auth0-vue"
import { type App, ref } from "vue"
import { vi } from "vitest"

export function mockAuth0() {
  const getAccessTokenSilently: Auth0VueClient["getAccessTokenSilently"] = vi.fn(async () => {
    throw new Error("Configure the Auth0 token response in this test")
  })

  const auth0 = {
    isLoading: ref(false),
    isAuthenticated: ref(true),
    user: ref<Auth0VueClient["user"]["value"]>(undefined),
    idTokenClaims: ref<Auth0VueClient["idTokenClaims"]["value"]>(undefined),
    error: ref<Auth0VueClient["error"]["value"]>(null),
    loginWithRedirect: vi.fn<Auth0VueClient["loginWithRedirect"]>().mockResolvedValue(undefined),
    loginWithPopup: vi.fn<Auth0VueClient["loginWithPopup"]>().mockResolvedValue(undefined),
    logout: vi.fn<Auth0VueClient["logout"]>().mockResolvedValue(undefined),
    checkSession: vi.fn<Auth0VueClient["checkSession"]>().mockResolvedValue(undefined),
    handleRedirectCallback: vi.fn<Auth0VueClient["handleRedirectCallback"]>().mockResolvedValue({}),
    getAccessTokenSilently,
    getAccessTokenWithPopup: vi
      .fn<Auth0VueClient["getAccessTokenWithPopup"]>()
      .mockRejectedValue(new Error("Configure the Auth0 token response in this test")),
    install(application: App) {
      application.provide(AUTH0_INJECTION_KEY, auth0)
      application.config.globalProperties.$auth0 = auth0
    },
  }

  return auth0
}

export default mockAuth0
