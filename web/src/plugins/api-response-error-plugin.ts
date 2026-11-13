import { type App } from "vue"
import { START_LOCATION } from "vue-router"
import { isAxiosError, isCancel } from "axios"

import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import UnexpectedApiResponseError from "@/api/errors/unexpected-api-response-error"

import useCloudflareChallenge from "@/use/use-cloudflare-challenge"
import useSnack from "@/use/use-snack"

export function apiResponseErrorPlugin(application: App): void {
  const previousErrorHandler = application.config.errorHandler
  const { error: cloudflareChallengeError } = useCloudflareChallenge()
  const router = application.config.globalProperties.$router
  const auth0 = application.config.globalProperties.$auth0
  const snack = useSnack()

  const stopNavigationErrorWatch = router.onError((error, to) => {
    if (
      router.currentRoute.value === START_LOCATION &&
      (error instanceof AuthenticationRequiredError || error instanceof CloudflareChallengeError)
    ) {
      // Auth0 clears its callback URL before the protected destination can commit.
      router.options.history.replace(to.fullPath)
      return
    }

    console.error("Failed to navigate to ELCC page", { error })
  })
  application.onUnmount(stopNavigationErrorWatch)

  // Detached editor popups share the app context but are outside App's component ancestry.
  application.config.errorHandler = async (error, instance, info) => {
    if (error instanceof AuthenticationRequiredError) {
      let target = router.currentRoute.value.fullPath
      if (router.currentRoute.value === START_LOCATION) {
        target = router.options.history.location
      }

      await auth0.loginWithRedirect({
        appState: { target },
      })
      return
    }

    if (error instanceof CloudflareChallengeError) {
      cloudflareChallengeError.value = error
      return
    }

    if (error instanceof UnexpectedApiResponseError) {
      console.error(`Unexpected API response from ELCC: ${error}`, { error })
      await router.replace({
        name: "errors/InternalServerErrorPage",
      })
      return
    }

    if (isAxiosError(error) && !error.response && !isCancel(error)) {
      snack.error(
        "The server could not be reached. Your changes have not been confirmed saved. Check the current server state before retrying."
      )
    }

    if (previousErrorHandler) {
      previousErrorHandler(error, instance, info)
    } else {
      console.error(error)
    }
  }
}

export default apiResponseErrorPlugin
