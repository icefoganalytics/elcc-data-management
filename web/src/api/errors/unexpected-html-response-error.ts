import type { AxiosResponse } from "axios"

import UnexpectedApiResponseError from "@/api/errors/unexpected-api-response-error"

export class UnexpectedHtmlResponseError extends UnexpectedApiResponseError {
  public static isUnexpectedHtmlResponse(response?: AxiosResponse): boolean {
    if (!response) return false

    const { responseType } = response.config
    if (responseType && responseType !== "json") return false

    const contentType = this.responseHeader(response, "content-type")
    const hasHtmlContentType =
      typeof contentType === "string" &&
      /^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(contentType)
    const hasHtmlDocument =
      typeof response.data === "string" && /^\s*(?:<!doctype\s+html\b|<html\b)/i.test(response.data)

    if (!hasHtmlContentType && !hasHtmlDocument) return false

    const path = this.extractRequestPath(response)
    return (
      path === "/api" ||
      path === "/_status" ||
      path.startsWith("/api/") ||
      path === "/_public" ||
      path.startsWith("/_public/")
    )
  }

  public readonly name = "UnexpectedHtmlResponseError"

  constructor(response: AxiosResponse) {
    super(
      "ELCC received an HTML page instead of API data. ELCC could not confirm the request completed.",
      response
    )
  }
}

export default UnexpectedHtmlResponseError
