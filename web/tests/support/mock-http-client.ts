import { type AxiosRequestConfig } from "axios"

import httpClient from "@/api/http-client"

vi.mock("@/api/http-client")

/**
 * Usage:
 * At the top section of a test file import:
 *   import { mockHttpClient } from "@/tests/support"
 *
 * Then where you want to set the http client:
 *   mockHttpClient()
 *
 * Note that order of operations matters. This file must be imported before any file that imports httpClient.
 * As such this file has been imported and mocked in the pre-test run "web/tests/setup.ts" file.
 *
 * @returns The mocked http client
 */
export function mockHttpClient() {
  const httpClientMock = vi.mocked(httpClient, true)

  httpClientMock.get.mockResolvedValue({
    data: {},
  })
  httpClientMock.post.mockResolvedValue({
    data: {},
  })
  httpClientMock.put.mockResolvedValue({
    data: {},
  })
  httpClientMock.patch.mockResolvedValue({
    data: {},
  })
  httpClientMock.delete.mockResolvedValue({
    data: {},
  })

  return httpClientMock
}

type HttpGetRouteHandler = (
  config: AxiosRequestConfig<unknown> | undefined
) => { data: unknown } | Promise<{ data: unknown }>

/**
 * Overrides exact GET URLs for one scenario, preserving the previous implementation
 * for unmatched URLs. Vitest's configured mock reset clears registrations between tests.
 */
export function mockHttpGetRoutes(routes: Record<string, HttpGetRouteHandler>) {
  const getMock = vi.mocked(httpClient.get)
  const previousImplementation = getMock.getMockImplementation()

  getMock.mockImplementation(async (url, config) => {
    if (Object.hasOwn(routes, url)) {
      return routes[url](config)
    }

    return previousImplementation?.(url, config)
  })
}

export default mockHttpClient
