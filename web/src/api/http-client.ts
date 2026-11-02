import qs from "qs"
import axios from "axios"

import { API_BASE_URL } from "@/config"
import { parseJsonResponse, classifyApiResponse } from "@/api/parse-json-response"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import { AuthenticationRequiredError } from "@/api/errors/authentication-required-error"
import auth0 from "@/plugins/auth0-plugin"

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  transformResponse: [parseJsonResponse],
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
  if (config.url?.startsWith("/api")) {
    const accessToken = await auth0.getAccessTokenSilently()
    config.headers["Authorization"] = `Bearer ${accessToken}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof UnexpectedApiResponseError || axios.isCancel(error)) throw error
    if (error?.error === "login_required") throw new AuthenticationRequiredError()

    const response = error?.response
    if (response) {
      const classified = classifyApiResponse(response)
      if (classified) throw classified
    }
    throw error
  }
)

export default httpClient
