import axios from "axios"

import qs from "qs"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import UnexpectedHtmlResponseError from "@/api/errors/unexpected-html-response-error"

import { API_BASE_URL } from "@/config"
import auth0 from "@/plugins/auth0-plugin"

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: {
    serialize: (params) => {
      return qs.stringify(params, {
        arrayFormat: "indices",
        strictNullHandling: true,
        allowEmptyArrays: true,
      })
    },
  },
})

httpClient.interceptors.request.use(async (config) => {
  // Only add the Authorization header to requests that start with "/api"
  if (config.url?.startsWith("/api")) {
    const accessToken = await auth0.getAccessTokenSilently()
    config.headers["Authorization"] = `Bearer ${accessToken}`
  }

  return config
})

httpClient.interceptors.response.use(
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

export default httpClient
