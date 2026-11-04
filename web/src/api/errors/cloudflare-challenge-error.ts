import type { AxiosResponse } from "axios"

import UnexpectedApiResponseError from "@/api/errors/unexpected-api-response-error"

const MAX_CLOUDFLARE_PREVIEW_LENGTH = 64 * 1024

export class CloudflareChallengeError extends UnexpectedApiResponseError {
  public static readonly NONE = new CloudflareChallengeError()

  /**
   * Use Cloudflare's explicit marker: neither HTTP 403 nor HTML alone proves a challenge.
   * @see https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/
   */
  public static isChallengeResponse(response?: Pick<AxiosResponse, "headers">): boolean {
    if (!response) return false

    return this.responseHeader(response, "cf-mitigated") === "challenge"
  }

  public readonly name = "CloudflareChallengeError"
  public readonly isPresent: boolean
  public readonly rayId: string | null
  public readonly cloudflareHtml: string

  constructor(response?: AxiosResponse) {
    if (!response) {
      super("")
      this.isPresent = false
      this.rayId = null
      this.cloudflareHtml = ""
      return
    }

    super(
      "Cloudflare browser verification is required. ELCC could not confirm the request completed.",
      response
    )
    this.isPresent = true
    const rayId = CloudflareChallengeError.responseHeader(response, "cf-ray")
    if (typeof rayId === "string") {
      this.rayId = rayId
    } else {
      this.rayId = null
    }

    if (typeof response.data === "string") {
      this.cloudflareHtml = response.data.slice(0, MAX_CLOUDFLARE_PREVIEW_LENGTH)
    } else {
      this.cloudflareHtml = ""
    }
  }
}

export default CloudflareChallengeError
