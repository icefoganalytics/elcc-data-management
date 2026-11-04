import { DOMWrapper, flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import { mockVuetify } from "@/tests/support"

import QualityEnhancementCategorySearchableAutocomplete from "@/components/quality-enhancement-categories/QualityEnhancementCategorySearchableAutocomplete.vue"

describe("web/src/components/quality-enhancement-categories/QualityEnhancementCategorySearchableAutocomplete.vue", () => {
  describe("QualityEnhancementCategorySearchableAutocomplete", () => {
    describe("category retry", () => {
      beforeEach(() => {
        vi.stubGlobal("visualViewport", undefined)
      })

      test.each([
        ["authentication", () => new AuthenticationRequiredError()],
        ["challenge", () => new CloudflareChallengeError()],
        ["unexpected", () => new Error("Network unavailable")],
      ] as const)(
        "when Retry receives a delayed %s failure, forwards the original error to Vue",
        async (_kind, buildError) => {
          // Arrange
          const error = buildError()
          vi.mocked(httpClient, true)
            .get.mockRejectedValueOnce(new ApiOperationError("Categories unavailable", 503))
            .mockRejectedValueOnce(error)
          const errorHandler = vi.fn()
          const wrapper = mount(QualityEnhancementCategorySearchableAutocomplete, {
            props: { modelValue: null, fundingPeriodId: 1 },
            attachTo: document.body,
            global: { config: { errorHandler }, plugins: [mockVuetify()] },
          })
          await flushPromises()
          await wrapper.get("input").trigger("mousedown")
          await flushPromises()
          const retry = new DOMWrapper(document.body)
            .findAll("button")
            .find((button) => button.text() === "Retry")
          if (!retry) throw new Error("Expected Retry")

          // Act
          await retry.trigger("click")
          await flushPromises()

          // Assert
          expect(errorHandler.mock.calls[0]?.[0]).toBe(error)
        }
      )
    })
  })
})
