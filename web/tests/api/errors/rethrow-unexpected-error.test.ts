import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

describe("web/src/api/errors/rethrow-unexpected-error.ts", () => {
  describe("rethrowUnexpectedError", () => {
    describe("aggregate recovery", () => {
      test("when a network error precedes nested authentication, throws the original authentication error", async () => {
        // Arrange
        const authenticationError = new AuthenticationRequiredError()
        const error = new AggregateError([
          new Error("network failure"),
          new AggregateError([new Error("unknown failure"), authenticationError]),
        ])

        // Act
        const result = Promise.resolve().then(() => rethrowUnexpectedError(error))

        // Assert
        await expect(result).rejects.toBe(authenticationError)
      })

      test("when a network error precedes a challenge, throws the original challenge error", async () => {
        // Arrange
        const challengeError = new CloudflareChallengeError()
        const error = new AggregateError([new Error("network failure"), challengeError])

        // Act
        const result = Promise.resolve().then(() => rethrowUnexpectedError(error))

        // Assert
        await expect(result).rejects.toBe(challengeError)
      })

      test("when authentication and challenge failures are both present, prefers authentication", async () => {
        // Arrange
        const authenticationError = new AuthenticationRequiredError()
        const challengeError = new CloudflareChallengeError()
        const error = new AggregateError([challengeError, authenticationError])

        // Act
        const result = Promise.resolve().then(() => rethrowUnexpectedError(error))

        // Assert
        await expect(result).rejects.toBe(authenticationError)
      })
    })
  })
})
