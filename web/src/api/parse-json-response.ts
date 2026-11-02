import { AxiosHeaders, type AxiosResponse, type AxiosResponseTransformer } from "axios"

import { ApiOperationError } from "@/api/errors/api-operation-error"
import { AuthenticationRequiredError } from "@/api/errors/authentication-required-error"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

/** Shared by both JSON clients, before fulfilled or rejected responses reach consumers. */
export const parseJsonResponse: AxiosResponseTransformer = function (
  data,
  responseHeaders,
  status
) {
  if (this.responseType && this.responseType !== "json") return data

  const headers = AxiosHeaders.from(responseHeaders)
  const isChallenge = headers.get("cf-mitigated") === "challenge"
  const contentType = String(headers.get("content-type") || "")
  const isHtml = /^(text\/html|application\/xhtml\+xml)(?:\s*;|\s*$)/i.test(contentType)
  const hasHtmlBody = typeof data === "string" && /^\s*<(?:!doctype\s+html|html\b)/i.test(data)

  if (isChallenge || isHtml || hasHtmlBody) {
    throw new UnexpectedApiResponseError(this, status || 0, headers, isChallenge)
  }

  if (typeof data !== "string") return data

  if (data.trim() === "" && (status === 204 || status === 205 || this.method === "head")) {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    throw new UnexpectedApiResponseError(this, status || 0, headers)
  }
}

export function classifyApiResponse(response: AxiosResponse): Error | undefined {
  if (AuthenticationRequiredError.isAuthenticationRequiredResponse(response)) {
    return new AuthenticationRequiredError(response.data.message)
  }

  if (ApiOperationError.isOperationErrorResponse(response)) {
    return new ApiOperationError(response.data.message, response.status)
  }
}

export default parseJsonResponse
