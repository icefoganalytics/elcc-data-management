import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios"

import httpClient from "@/api/http-client"
import { SecureAPICall } from "@/store/helpers/axiosAPIConfig"
import { AuthenticationRequiredError } from "@/api/errors/authentication-required-error"
import { CloudflareChallengeError } from "@/api/errors/cloudflare-challenge-error"
import { UnexpectedHtmlResponseError } from "@/api/errors/unexpected-html-response-error"

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

describe("web/src/api/http-client.ts real clients", () => {
  const clients = [
    ["shared httpClient", httpClient],
    ["authenticated API client", SecureAPICall("get", "token")],
  ] as const

  test.each(clients)(
    "when %s receives a JSON operation failure, classifies its message and status",
    async (_name, client) => {
      // Arrange
      const adapter = client.defaults.adapter
      client.defaults.adapter = async (config) => {
        throw failedResponse(config, 403, { message: "Denied" })
      }

      // Act
      const request = client.get("/api/items")

      // Assert
      await expect(request).rejects.toMatchObject({
        name: "ApiOperationError",
        message: "Denied",
        status: 403,
      })
      client.defaults.adapter = adapter
    }
  )

  test.each(clients)(
    "when %s receives a JSON 401, classifies authentication distinctly",
    async (_name, client) => {
      // Arrange
      const adapter = client.defaults.adapter
      client.defaults.adapter = async (config) => {
        throw failedResponse(config, 401, { message: "Expired" })
      }

      // Act
      const request = client.get("/api/items")

      // Assert
      await expect(request).rejects.toBeInstanceOf(AuthenticationRequiredError)
      client.defaults.adapter = adapter
    }
  )

  describe.each(clients)("%s", (_name, client) => {
    test.each([200, 403, 502])(
      "when marked HTML arrives with status %i, requires challenge recovery",
      async (status) => {
        // Arrange
        const adapter = client.defaults.adapter
        client.defaults.adapter = async (config) => {
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
        const request = client.get("/api/items")

        // Assert
        await expect(request).rejects.toBeInstanceOf(CloudflareChallengeError)
        client.defaults.adapter = adapter
      }
    )

    test.each([200, 403, 502])(
      "when unmarked HTML arrives with status %i, reports an unexpected HTML failure",
      async (status) => {
        // Arrange
        const adapter = client.defaults.adapter
        client.defaults.adapter = async (config) => {
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
        const request = client.get("/_status")

        // Assert
        await expect(request).rejects.toBeInstanceOf(UnexpectedHtmlResponseError)
        client.defaults.adapter = adapter
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

  test("when Axios cancels a request, preserves the cancellation identity", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    const cancellation = new axios.CanceledError()
    httpClient.defaults.adapter = () => Promise.reject(cancellation)

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toBe(cancellation)
    httpClient.defaults.adapter = adapter
  })

  test("when the network fails, preserves the transport error identity", async () => {
    // Arrange
    const adapter = httpClient.defaults.adapter
    const networkFailure = new AxiosError("Network unavailable", "ERR_NETWORK")
    httpClient.defaults.adapter = () => Promise.reject(networkFailure)

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toBe(networkFailure)
    httpClient.defaults.adapter = adapter
  })
})
