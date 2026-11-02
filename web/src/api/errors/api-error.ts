import { AxiosHeaders, type AxiosResponse } from "axios"

export class ApiError extends Error {
  public readonly name: string = "ApiError"

  protected static responseHeader(response: Pick<AxiosResponse, "headers">, name: string) {
    if (response.headers instanceof AxiosHeaders) return response.headers.get(name)
    return response.headers[name]
  }

  protected static isApiResponseWithErrorMessage(response?: AxiosResponse): boolean {
    if (!response || (response.config.responseType && response.config.responseType !== "json")) {
      return false
    }
    const contentType = this.responseHeader(response, "content-type")
    if (typeof contentType !== "string") return false
    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase()
    if (
      mediaType !== "application/json" &&
      !(mediaType.startsWith("application/") && mediaType.endsWith("+json"))
    ) {
      return false
    }
    const data = response.data
    if (!data || typeof data !== "object" || Array.isArray(data)) return false
    if (!("message" in data) || typeof data.message !== "string" || !data.message) return false
    const path = new URL(
      response.config.url || "",
      new URL(response.config.baseURL || "/", window.location.origin)
    ).pathname
    return (
      path === "/api" ||
      path.startsWith("/api/") ||
      path === "/_public" ||
      path.startsWith("/_public/")
    )
  }
}

export default ApiError
