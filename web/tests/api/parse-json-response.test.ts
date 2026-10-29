import { AxiosHeaders } from "axios"

import { parseJsonResponse } from "@/api/parse-json-response"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

describe("web/src/api/parse-json-response.ts", () => {
  describe("parseJsonResponse", () => {
    describe("expected JSON responses", () => {
      test.each([200, 403, 502])(
        "when marked HTML arrives with status %i, rejects it as a challenge",
        (status) => {
          // Arrange
          const headers = new AxiosHeaders({
            "content-type": "text/html",
            "cf-mitigated": "challenge",
          })

          // Act / Assert
          expect(() =>
            parseJsonResponse.call(
              { url: "/api/current-user", headers: new AxiosHeaders() },
              "<html>blocked</html>",
              headers,
              status
            )
          ).toThrow(expect.objectContaining({ isChallenge: true, status }))
        }
      )

      test.each([200, 403, 502])(
        "when unmarked HTML arrives with status %i, rejects it without challenge classification",
        (status) => {
          // Arrange
          const headers = new AxiosHeaders({
            "content-type": "text/html; charset=utf-8",
            server: "cloudflare",
            "cf-ray": "safe-ray",
          })

          // Act / Assert
          expect(() =>
            parseJsonResponse.call(
              { url: "/_status", headers: new AxiosHeaders() },
              "<html>blocked</html>",
              headers,
              status
            )
          ).toThrow(expect.objectContaining({ isChallenge: false, status }))
        }
      )

      test("when HTML is mislabeled JSON, rejects the body before consumer access", () => {
        // Arrange
        const headers = new AxiosHeaders({ "content-type": "application/json" })

        // Act / Assert
        expect(() =>
          parseJsonResponse.call(
            { headers: new AxiosHeaders() },
            "<!DOCTYPE html><html>blocked</html>",
            headers,
            200
          )
        ).toThrow(UnexpectedApiResponseError)
      })

      test("when JSON is malformed, rejects it instead of returning successful text", () => {
        // Arrange
        const headers = new AxiosHeaders({ "content-type": "application/json" })

        // Act / Assert
        expect(() =>
          parseJsonResponse.call({ headers: new AxiosHeaders() }, '{"invalid":', headers, 200)
        ).toThrow(UnexpectedApiResponseError)
      })

      test("when the server returns a JSON permission error, preserves its response data", () => {
        // Arrange
        const headers = new AxiosHeaders({ "content-type": "application/json" })

        // Act
        const data = parseJsonResponse.call(
          { headers: new AxiosHeaders() },
          '{"message":"Not authorized"}',
          headers,
          403
        )

        // Assert
        expect(data).toEqual({ message: "Not authorized" })
      })

      test("when an intentional text response is requested, preserves it without JSON classification", () => {
        // Arrange
        const headers = new AxiosHeaders({
          "content-type": "text/html",
          "cf-mitigated": "challenge",
        })

        // Act
        const data = parseJsonResponse.call(
          { responseType: "text", headers: new AxiosHeaders() },
          "<html>download</html>",
          headers,
          200
        )

        // Assert
        expect(data).toEqual("<html>download</html>")
      })

      test("when a delete returns no content, preserves the empty response", () => {
        // Arrange
        const headers = new AxiosHeaders()

        // Act
        const data = parseJsonResponse.call(
          { method: "delete", headers: new AxiosHeaders() },
          "",
          headers,
          204
        )

        // Assert
        expect(data).toEqual("")
      })
    })
  })
})
