import { AxiosHeaders, type AxiosRequestConfig } from "axios"

/** Metadata only: never retain the response body, request config, or original error. */
export class UnexpectedApiResponseError extends Error {
  readonly isChallenge: boolean
  readonly method: string
  readonly path: string
  readonly status: number
  readonly rayId: string | undefined

  constructor(
    config: AxiosRequestConfig,
    status: number,
    headers: AxiosHeaders,
    isChallenge = false
  ) {
    super(
      isChallenge
        ? "The request was interrupted by a browser verification challenge."
        : "The server returned an unexpected response instead of JSON."
    )
    this.name = "UnexpectedApiResponseError"
    this.isChallenge = isChallenge
    this.method = (config.method || "get").toUpperCase()
    this.path = sanitizedPath(config)
    this.status = status

    const rayId = headers.get("cf-ray")
    this.rayId =
      typeof rayId === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(rayId) ? rayId : undefined
  }
}

function sanitizedPath(config: AxiosRequestConfig): string {
  try {
    const baseUrl = new URL(config.baseURL || "/", window.location.origin)
    return new URL(config.url || "/", baseUrl).pathname
  } catch {
    return "/"
  }
}

export default UnexpectedApiResponseError
