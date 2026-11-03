import ApiOperationError from "@/api/errors/api-operation-error"

export function rethrowUnexpectedError(error: unknown): void {
  if (error instanceof ApiOperationError) return

  if (error instanceof AggregateError && error.errors.length > 0) {
    for (const cause of error.errors) {
      rethrowUnexpectedError(cause)
    }

    return
  }

  throw error
}

export default rethrowUnexpectedError
