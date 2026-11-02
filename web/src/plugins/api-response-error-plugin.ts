import { type App } from "vue"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import auth0 from "@/plugins/auth0-plugin"

import useSnack from "@/use/use-snack"

export function apiResponseErrorPlugin(application: App): void {
  const previousErrorHandler = application.config.errorHandler
  const snack = useSnack()

  application.config.errorHandler = async (error, instance, info) => {
    if (error instanceof AuthenticationRequiredError) {
      await auth0.loginWithRedirect({
        appState: { targetUrl: window.location.pathname },
      })
      return
    }

    const apiResponseError = findUnexpectedApiResponseError(error)
    if (apiResponseError !== null) {
      snack.error(apiResponseError.message, { timeout: -1 })
      snack.apiResponseError.value = apiResponseError
      return
    }

    if (error instanceof ApiOperationError) {
      snack.error(error.message)
      return
    }

    if (previousErrorHandler) {
      previousErrorHandler(error, instance, info)
    } else {
      console.error(error)
    }
  }
}

function findUnexpectedApiResponseError(error: unknown): UnexpectedApiResponseError | null {
  if (error instanceof UnexpectedApiResponseError) return error
  if (!(error instanceof AggregateError)) return null

  for (const cause of error.errors) {
    const apiResponseError = findUnexpectedApiResponseError(cause)
    if (apiResponseError !== null) return apiResponseError
  }

  return null
}

export default apiResponseErrorPlugin
