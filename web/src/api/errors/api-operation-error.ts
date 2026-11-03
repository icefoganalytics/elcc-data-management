import type { AxiosResponse } from "axios"

import ApiError from "@/api/errors/api-error"

export class ApiOperationError extends ApiError {
  public static isOperationErrorResponse(response?: AxiosResponse): boolean {
    if (!response || response.status === 401) return false

    return this.isApiResponseWithErrorMessage(response)
  }

  public readonly name = "ApiOperationError"

  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
  }
}

export default ApiOperationError
