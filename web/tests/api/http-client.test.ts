import mockAxios from "@/tests/support/mock-axios"

import httpClient from "@/api/http-client"

vi.hoisted(() => vi.resetModules())
const getAccessTokenSilentlyMock = vi.hoisted(() => vi.fn())
vi.mock("@/plugins/auth0-plugin", () => ({
  default: { getAccessTokenSilently: getAccessTokenSilentlyMock },
}))
vi.unmock("@/api/http-client")

describe("web/src/api/http-client.ts", () => {
  test("when a JSON operation fails, classifies its message and status", async () => {
    // Arrange
    const mock = mockAxios(httpClient)
    mock.onGet("/api/items").reply(
      403,
      { message: "Denied" },
      { "content-type": "application/json" }
    )

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "ApiOperationError",
      message: "Denied",
      status: 403,
    })
  })

  test("when a JSON 401 arrives, classifies authentication distinctly", async () => {
    // Arrange
    const mock = mockAxios(httpClient)
    mock.onGet("/api/items").reply(
      401,
      { message: "Expired" },
      { "content-type": "application/json" }
    )

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "AuthenticationRequiredError",
      message: "Expired",
    })
  })

  describe("HTML responses", () => {
    test.each([200, 403, 502])(
      "when marked HTML arrives with status %i, requires challenge recovery",
      async (status) => {
        // Arrange
        const mock = mockAxios(httpClient)
        mock.onGet("/api/items").reply(status, "<html>Browser verification</html>", {
          "content-type": "text/html",
          "cf-mitigated": "challenge",
        })

        // Act
        const request = httpClient.get("/api/items")

        // Assert
        await expect(request).rejects.toMatchObject({
          name: "CloudflareChallengeError",
          message:
            "Cloudflare browser verification is required. ELCC could not confirm the request completed.",
        })
      }
    )

    test.each([200, 403, 502])(
      "when unmarked HTML arrives with status %i, reports an unexpected HTML failure",
      async (status) => {
        // Arrange
        const mock = mockAxios(httpClient)
        mock.onGet("/_status").reply(status, "<html>Upstream error</html>", {
          "content-type": "text/html",
        })

        // Act
        const request = httpClient.get("/_status")

        // Assert
        await expect(request).rejects.toMatchObject({
          name: "UnexpectedHtmlResponseError",
          message:
            "ELCC received an HTML page instead of API data. ELCC could not confirm the request completed.",
        })
      }
    )
  })

  test("when a successful JSON response has a message field, returns it as ordinary data", async () => {
    // Arrange
    const mock = mockAxios(httpClient)
    mock.onGet("/api/items").reply(
      200,
      { message: "Created" },
      { "content-type": "application/json" }
    )

    // Act
    const response = httpClient.get("/api/items")

    // Assert
    await expect(response).resolves.toMatchObject({ data: { message: "Created" } })
  })

  test("when a caller requests text, preserves intentional HTML", async () => {
    // Arrange
    const mock = mockAxios(httpClient)
    mock.onGet("/api/documents/1").reply(200, "<html>Requested document</html>", {
      "content-type": "text/html",
    })

    // Act
    const response = httpClient.get("/api/documents/1", { responseType: "text" })

    // Assert
    await expect(response).resolves.toMatchObject({ data: "<html>Requested document</html>" })
  })

  test("when Axios cancels a request, preserves the cancellation error", async () => {
    // Arrange
    const mock = mockAxios(httpClient)
    const controller = new AbortController()
    mock.onGet("/api/items").reply(() => {
      controller.abort()
      return [200, {}]
    })

    // Act
    const request = httpClient.get("/api/items", { signal: controller.signal })

    // Assert
    await expect(request).rejects.toMatchObject({
      name: "CanceledError",
      message: "canceled",
      code: "ERR_CANCELED",
    })
  })

  test("when the network fails, preserves the transport error details", async () => {
    // Arrange
    const mock = mockAxios(httpClient)
    mock.onGet("/api/items").networkError()

    // Act
    const request = httpClient.get("/api/items")

    // Assert
    await expect(request).rejects.toMatchObject({
      message: "Network Error",
      isAxiosError: true,
    })
  })
})
