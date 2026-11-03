import { AxiosHeaders, type AxiosResponse } from "axios"

export class ApiError extends Error {
  public readonly name: string = "ApiError"

  protected static responseHeader(response: Pick<AxiosResponse, "headers">, name: string) {
    if (response.headers instanceof AxiosHeaders) {
      return response.headers.get(name)
    }

    return response.headers[name]
  }

  protected static extractRequestPath(response: AxiosResponse): string {
    const baseUrl = new URL(response.config.baseURL ?? "/", window.location.origin)
    return new URL(response.config.url ?? "", baseUrl).pathname
  }

  /** Recognizes responses from our JSON API endpoints carrying the UI's error-message format. */
  protected static isApiResponseWithErrorMessage(response?: AxiosResponse): boolean {
    if (!response) return false

    const { responseType } = response.config
    if (responseType && responseType !== "json") return false

    const contentType = this.responseHeader(response, "content-type")
    if (typeof contentType !== "string") return false

    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase()
    if (
      mediaType !== "application/json" &&
      !(mediaType.startsWith("application/") && mediaType.endsWith("+json"))
    ) {
      return false
    }

    // Axios handles JSON parsing; recognize the expected error payload, not arbitrary JSON.
    const data = response.data
    if (!data || typeof data !== "object" || Array.isArray(data)) return false
    if (typeof data.message !== "string" || !data.message) return false

    const requestPath = this.extractRequestPath(response)
    return (
      requestPath === "/api" ||
      requestPath.startsWith("/api/") ||
      requestPath === "/_public" ||
      requestPath.startsWith("/_public/")
    )
  }
}

export default ApiError
