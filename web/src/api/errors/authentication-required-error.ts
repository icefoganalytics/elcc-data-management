import type { AxiosResponse } from "axios"

import ApiError from "@/api/errors/api-error"

export class AuthenticationRequiredError extends ApiError {
  public static isAuthenticationRequiredResponse(response?: AxiosResponse): boolean {
    return Boolean(
      response && response.status === 401 && this.isApiResponseWithErrorMessage(response)
    )
  }

  public readonly name = "AuthenticationRequiredError"

  constructor(message = "You must be logged in to access this endpoint") {
    super(message)
  }
}

export default AuthenticationRequiredError
