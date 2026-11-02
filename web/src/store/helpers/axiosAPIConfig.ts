// A small wrapper for axios to include a jwt with the api request

import axios from "axios"

import { parseJsonResponse, classifyApiResponse } from "@/api/parse-json-response"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import { AuthenticationRequiredError } from "@/api/errors/authentication-required-error"

export function SecureAPICall(method: string, token: string) {
  const headers = {
    "Content-Type": "application/json",
  }
  if (token) {
    Object.assign(headers, { Authorization: `Bearer ${token}` })
  }
  const client = axios.create({
    method: method,
    transformResponse: [parseJsonResponse],
    headers: headers,
  })
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error instanceof UnexpectedApiResponseError || axios.isCancel(error)) throw error

      if (error?.error === "login_required") throw new AuthenticationRequiredError()

      const classified = error?.response ? classifyApiResponse(error.response) : undefined
      throw classified || error
    }
  )
  return client
}
