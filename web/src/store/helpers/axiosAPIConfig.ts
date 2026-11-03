// A small wrapper for axios to include a jwt with the api request

import axios from "axios"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import UnexpectedHtmlResponseError from "@/api/errors/unexpected-html-response-error"

export function SecureAPICall(method: string, token: string) {
  const headers = {
    "Content-Type": "application/json",
  }
  if (token) {
    Object.assign(headers, { Authorization: `Bearer ${token}` })
  }
  const client = axios.create({
    method: method,
    headers: headers,
  })
  client.interceptors.response.use(
    // Axios resolves HTTP 2xx responses here, but they can still contain unexpected HTML.
    (response) => {
      if (CloudflareChallengeError.isChallengeResponse(response)) {
        throw new CloudflareChallengeError(response)
      }

      if (UnexpectedHtmlResponseError.isUnexpectedHtmlResponse(response)) {
        throw new UnexpectedHtmlResponseError(response)
      }

      return response
    },
    // HTTP responses outside the 2xx range and request failures reach this error handler.
    (error) => {
      if (axios.isCancel(error)) {
        throw error
      }

      const response = error?.response
      if (CloudflareChallengeError.isChallengeResponse(response)) {
        throw new CloudflareChallengeError(response)
      }

      if (UnexpectedHtmlResponseError.isUnexpectedHtmlResponse(response)) {
        throw new UnexpectedHtmlResponseError(response)
      }

      if (error?.error === "login_required") {
        throw new AuthenticationRequiredError()
      }

      if (AuthenticationRequiredError.isAuthenticationRequiredResponse(response)) {
        throw new AuthenticationRequiredError(response.data.message)
      }

      if (ApiOperationError.isOperationErrorResponse(response)) {
        throw new ApiOperationError(response.data.message, response.status)
      }

      throw error
    }
  )

  return client
}
