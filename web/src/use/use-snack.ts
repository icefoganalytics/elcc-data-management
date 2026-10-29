import { shallowReactive, toRef, type ToRef } from "vue"
import { type VSnackbar } from "vuetify/components"

import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

type VSnackbarProps = VSnackbar["$props"]
type SnackOptions = VSnackbarProps & { cause?: unknown }

const state = shallowReactive<{
  message: string
  options: VSnackbarProps
  apiResponseError: UnexpectedApiResponseError | null
}>({
  message: "",
  options: {},
  apiResponseError: null,
})

/**
 * @example
 * const snack = useSnack()
 * snack("Hello world", { color: "success" })
 *
 * @example
 * const snack = useSnack()
 * snack.success("Hello world")
 */
export function useSnack(defaultOptions: VSnackbarProps = {}): {
  (message: string, options?: SnackOptions): void
  message: ToRef<string>
  options: ToRef<VSnackbarProps>
  apiResponseError: ToRef<UnexpectedApiResponseError | null>
  notify: (message: string, options?: SnackOptions) => void
  reset: () => void
  success: (message: string, options?: VSnackbarProps) => void
  error: (message: string, options?: SnackOptions) => void
  info: (message: string, options?: VSnackbarProps) => void
  warning: (message: string, options?: VSnackbarProps) => void
} {
  const notify = (message: string, options: SnackOptions = {}) => {
    const { cause, ...snackbarOptions } = options

    if (cause instanceof UnexpectedApiResponseError) {
      state.apiResponseError = cause
      state.message = message
      state.options = { ...defaultOptions, ...snackbarOptions, color: "error", timeout: -1 }
      return
    }

    if (state.apiResponseError !== null) return

    state.message = message
    state.options = { ...defaultOptions, ...snackbarOptions }
  }

  notify.message = toRef(state, "message")
  notify.options = toRef(state, "options")
  notify.apiResponseError = toRef(state, "apiResponseError")

  notify.notify = notify

  notify.reset = () => {
    state.message = ""
    state.options = {}
    state.apiResponseError = null
  }

  notify.success = (message: string, options: VSnackbarProps = {}) => {
    notify(message, { color: "success", ...options })
  }

  notify.error = (message: string, options: SnackOptions = {}) => {
    notify(message, { color: "error", ...options })
  }

  notify.info = (message: string, options: VSnackbarProps = {}) => {
    notify(message, { color: "info", ...options })
  }

  notify.warning = (message: string, options: VSnackbarProps = {}) => {
    notify(message, { color: "warning", ...options })
  }

  return notify
}

export default useSnack
