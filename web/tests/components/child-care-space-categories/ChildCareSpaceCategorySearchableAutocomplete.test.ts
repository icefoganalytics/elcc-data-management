import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import type { ChildCareSpaceCategoryAsIndex } from "@/api/child-care-space-categories-api"

import { mockVuetify } from "@/tests/support"

import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"

describe("web/src/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue", () => {
  describe("ChildCareSpaceCategorySearchableAutocomplete", () => {
    describe("selected category", () => {
      test("when search results exclude the linked category, keeps its resolved label visible", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
        vi.stubGlobal("visualViewport", undefined)
        onTestFinished(() => {
          vi.useRealTimers()
          vi.unstubAllGlobals()
        })
        const selectedCategory: ChildCareSpaceCategoryAsIndex = {
          id: 10,
          fundingPeriodId: 1,
          categoryName: "Linked Infants",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "700.0000",
          createdAt: "2024-04-01T00:00:00Z",
          updatedAt: "2024-04-01T00:00:00Z",
          deletedAt: null,
        }
        const matchingCategory: ChildCareSpaceCategoryAsIndex = {
          id: 20,
          fundingPeriodId: 1,
          categoryName: "Toddlers",
          fromAge: 2,
          toAge: 3,
          monthlyAmount: "500.0000",
          createdAt: "2024-04-01T00:00:00Z",
          updatedAt: "2024-04-01T00:00:00Z",
          deletedAt: null,
        }
        vi.mocked(httpClient, true).get.mockImplementation(async (_url, config) => ({
          data: {
            childCareSpaceCategories:
              config?.params?.where?.id === 10 ? [selectedCategory] : [matchingCategory],
            totalCount: 1,
          },
        }))
        const wrapper = mount(ChildCareSpaceCategorySearchableAutocomplete, {
          props: { modelValue: 10, where: { fundingPeriodId: [1] } },
          attachTo: document.body,
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get("input").setValue("Toddlers")
        await vi.advanceTimersByTimeAsync(500)
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-chip").text()).toBe("Linked Infants")
      })
    })
  })
})
