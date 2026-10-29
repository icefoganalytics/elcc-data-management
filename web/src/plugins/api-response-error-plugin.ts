import { type App } from "vue"

import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

import useSnack from "@/use/use-snack"

export function apiResponseErrorPlugin(application: App): void {
  const previousErrorHandler = application.config.errorHandler
  const snack = useSnack()

  application.config.errorHandler = (error, instance, info) => {
    if (error instanceof UnexpectedApiResponseError) {
      snack.error(error.message, { cause: error })
      return
    }

    if (previousErrorHandler) {
      previousErrorHandler(error, instance, info)
    } else {
      console.error(error)
    }
  }
}

export default apiResponseErrorPlugin
