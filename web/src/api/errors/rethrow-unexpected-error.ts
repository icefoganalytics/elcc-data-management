import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

export function rethrowUnexpectedError(error: unknown): void {
  if (error instanceof ApiOperationError) return

  if (error instanceof AggregateError && error.errors.length > 0) {
    const pending: unknown[] = [...error.errors].reverse()
    let firstUnexpectedError: unknown
    let hasUnexpectedError = false
    let authenticationError: AuthenticationRequiredError | undefined
    let challengeError: CloudflareChallengeError | undefined

    while (pending.length > 0) {
      const cause = pending.pop()
      if (cause instanceof ApiOperationError) continue
      if (cause instanceof AuthenticationRequiredError) {
        authenticationError ??= cause
        continue
      }
      if (cause instanceof CloudflareChallengeError) {
        challengeError ??= cause
        continue
      }
      if (cause instanceof AggregateError && cause.errors.length > 0) {
        pending.push(...[...cause.errors].reverse())
        continue
      }
      if (!hasUnexpectedError) {
        firstUnexpectedError = cause
        hasUnexpectedError = true
      }
    }

    if (authenticationError) throw authenticationError
    if (challengeError) throw challengeError
    if (hasUnexpectedError) throw firstUnexpectedError
    return
  }

  throw error
}

export default rethrowUnexpectedError
