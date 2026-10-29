// A small wrapper for axios to include a jwt with the api request

import axios from "axios"

import { parseJsonResponse } from "@/api/parse-json-response"

export function SecureAPICall(method: string, token: string) {
  const headers = {
    "Content-Type": "application/json",
  }
  if (token) {
    Object.assign(headers, { Authorization: `Bearer ${token}` })
  }
  return axios.create({
    method: method,
    transformResponse: [parseJsonResponse],
    headers: headers,
  })
}
