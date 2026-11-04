import type { AxiosResponse } from "axios"

import ApiError from "@/api/errors/api-error"

export abstract class UnexpectedApiResponseError extends ApiError {
  public readonly name: string = "UnexpectedApiResponseError"
  public readonly status: number
  public readonly method: string
  public readonly path: string

  constructor(message: string, response?: AxiosResponse) {
    super(message)

    if (!response) {
      this.status = 0
      this.method = ""
      this.path = ""
      return
    }

    this.status = response.status
    this.method = response.config.method?.toUpperCase() ?? "GET"
    this.path = UnexpectedApiResponseError.extractRequestPath(response)
  }
}

export default UnexpectedApiResponseError
