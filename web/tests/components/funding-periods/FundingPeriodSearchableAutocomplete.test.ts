import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import type { FundingPeriodAsShow } from "@/api/funding-periods-api"

import { mockVuetify } from "@/tests/support"

import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

type FundingPeriodResponse = {
  data: { fundingPeriod: FundingPeriodAsShow; policy: Record<string, never> }
}

describe("web/src/components/funding-periods/FundingPeriodSearchableAutocomplete.vue", () => {
  describe("FundingPeriodSearchableAutocomplete", () => {
    describe("selected funding period", () => {
      test("when an earlier selection finishes loading last, retains the current fiscal-year label", async () => {
        // Arrange
        const previousRequest = Promise.withResolvers<FundingPeriodResponse>()
        const currentRequest = Promise.withResolvers<FundingPeriodResponse>()
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/funding-periods/10") return previousRequest.promise
          if (url === "/api/funding-periods/20") return currentRequest.promise

          return { data: { fundingPeriods: [], totalCount: 0 } }
        })
        const wrapper = mount(FundingPeriodSearchableAutocomplete, {
          props: { modelValue: 10, selectFirstOnLoad: false },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        await wrapper.setProps({ modelValue: 20 })
        currentRequest.resolve({
          data: {
            fundingPeriod: {
              id: 20,
              fiscalYear: "2025-2026",
              title: "Current year",
              fromDate: "2025-04-01",
              toDate: "2026-03-31",
              createdAt: "2025-04-01T00:00:00Z",
              updatedAt: "2025-04-01T00:00:00Z",
            },
            policy: {},
          },
        })
        await flushPromises()

        // Act
        previousRequest.resolve({
          data: {
            fundingPeriod: {
              id: 10,
              fiscalYear: "2024-2025",
              title: "Previous year",
              fromDate: "2024-04-01",
              toDate: "2025-03-31",
              createdAt: "2024-04-01T00:00:00Z",
              updatedAt: "2024-04-01T00:00:00Z",
            },
            policy: {},
          },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-chip").text()).toEqual("2025-2026")
      })
    })
  })
})
