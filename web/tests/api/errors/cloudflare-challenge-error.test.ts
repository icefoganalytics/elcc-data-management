import { AxiosHeaders } from "axios"

import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

describe("web/src/api/errors/cloudflare-challenge-error.ts", () => {
  describe("CloudflareChallengeError", () => {
    describe(".isChallengeResponse", () => {
      test("when Axios headers use mixed casing, recognizes the challenge marker", () => {
        // Arrange
        const response = { headers: new AxiosHeaders({ "CF-Mitigated": "challenge" }) }

        // Act
        const isChallenge = CloudflareChallengeError.isChallengeResponse(response)

        // Assert
        expect(isChallenge).toBe(true)
      })

      test("when raw response headers contain the challenge marker, recognizes the challenge", () => {
        // Arrange
        const response = { headers: { "cf-mitigated": "challenge" } }

        // Act
        const isChallenge = CloudflareChallengeError.isChallengeResponse(response)

        // Assert
        expect(isChallenge).toBe(true)
      })

      test("when no response is available, does not classify a network failure as a challenge", () => {
        // Arrange
        const response = undefined

        // Act
        const isChallenge = CloudflareChallengeError.isChallengeResponse(response)

        // Assert
        expect(isChallenge).toBe(false)
      })

      test("when Cloudflare serves HTML without the marker, does not assume a challenge", () => {
        // Arrange
        const response = {
          headers: new AxiosHeaders({ server: "cloudflare", "content-type": "text/html" }),
        }

        // Act
        const isChallenge = CloudflareChallengeError.isChallengeResponse(response)

        // Assert
        expect(isChallenge).toBe(false)
      })
    })
  })
})
