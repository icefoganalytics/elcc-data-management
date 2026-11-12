import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios"

import httpClient from "@/api/http-client"

vi.hoisted(() => vi.resetModules())
const getAccessTokenSilentlyMock = vi.hoisted(() => vi.fn())
vi.mock("@/plugins/auth0-plugin", () => ({
  default: { getAccessTokenSilently: getAccessTokenSilentlyMock },
}))
vi.unmock("@/api/http-client")

function failedResponse(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, {
    config,
    data,
    headers: new AxiosHeaders({ "content-type": "application/json" }),
    status,
    statusText: "error",
  })
}

describe("web/src/api/http-client.ts", () => {
  test("when a JSON operation fails, classifies its message and status", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    httpClient.defaults.adapter = async (config) => {
      throw failedResponse(config, 403, { message: "Denied" })
    }

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "ApiOperationError",
      message: "Denied",
      status: 403,
    })
    httpClient.defaults.adapter = adapter
  })

  test("when a JSON 401 arrives, classifies authentication distinctly", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    httpClient.defaults.adapter = async (config) => {
      throw failedResponse(config, 401, { message: "Expired" })
    }

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "AuthenticationRequiredError",
      message: "Expired",
    })
    httpClient.defaults.adapter = adapter
  })

  describe("HTML responses", () => {
    test.each([200, 403, 502])(
      "when marked HTML arrives with status %i, requires challenge recovery",
      async (status) => {
        // Arrange
        const adapter = httpClient.defaults.adapter
        httpClient.defaults.adapter = async (config) => {
          const response = {
            config,
            data: "<html>Browser verification</html>",
            headers: new AxiosHeaders({
              "content-type": "text/html",
              "cf-mitigated": "challenge",
            }),
            status,
            statusText: "Controlled response",
          }
          if (status >= 400) {
            throw new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, response)
          }

          return response
        }

        // Act
        const request = httpClient.get("/api/items")

        // Assert
        await expect(request).rejects.toMatchObject({
          name: "CloudflareChallengeError",
          message:
            "Cloudflare browser verification is required. ELCC could not confirm the request completed.",
        })
        httpClient.defaults.adapter = adapter
      }
    )

    test.each([200, 403, 502])(
      "when unmarked HTML arrives with status %i, reports an unexpected HTML failure",
      async (status) => {
        // Arrange
        const adapter = httpClient.defaults.adapter
        httpClient.defaults.adapter = async (config) => {
          const response = {
            config,
            data: "<html>Upstream error</html>",
            headers: new AxiosHeaders({ "content-type": "text/html" }),
            status,
            statusText: "Controlled response",
          }
          if (status >= 400) {
            throw new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, response)
          }

          return response
        }

        // Act
        const request = httpClient.get("/_status")

        // Assert
        await expect(request).rejects.toMatchObject({
          name: "UnexpectedHtmlResponseError",
          message:
            "ELCC received an HTML page instead of API data. ELCC could not confirm the request completed.",
        })
        httpClient.defaults.adapter = adapter
      }
    )
  })

  test("when a successful JSON response has a message field, returns it as ordinary data", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    httpClient.defaults.adapter = async (config) => ({
      config,
      data: { message: "Created" },
      headers: new AxiosHeaders({ "content-type": "application/json" }),
      status: 200,
      statusText: "OK",
    })

    // Act
    const response = httpClient.get("/api/items")

    // Assert
    await expect(response).resolves.toMatchObject({ data: { message: "Created" } })
    httpClient.defaults.adapter = adapter
  })

  test("when a caller requests text, preserves intentional HTML", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    httpClient.defaults.adapter = async (config) => ({
      config,
      data: "<html>Requested document</html>",
      headers: new AxiosHeaders({ "content-type": "text/html" }),
      status: 200,
      statusText: "OK",
    })

    // Act
    const response = httpClient.get("/api/documents/1", { responseType: "text" })

    // Assert
    await expect(response).resolves.toMatchObject({ data: "<html>Requested document</html>" })
    httpClient.defaults.adapter = adapter
  })

  test("when Axios cancels a request, preserves the cancellation error", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    const cancellation = new axios.CanceledError()
    httpClient.defaults.adapter = () => Promise.reject(cancellation)

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "CanceledError",
      message: "canceled",
      code: "ERR_CANCELED",
    })
    httpClient.defaults.adapter = adapter
  })

  test("when the network fails, preserves the transport error details", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    const networkFailure = new AxiosError("Network unavailable", "ERR_NETWORK")
    httpClient.defaults.adapter = () => Promise.reject(networkFailure)

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "AxiosError",
      message: "Network unavailable",
      code: "ERR_NETWORK",
    })
    httpClient.defaults.adapter = adapter
  })
})
