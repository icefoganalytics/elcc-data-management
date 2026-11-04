import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"

import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue"

describe("web/src/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete", () => {
    describe("selected category hydration", () => {
      test("when the selected category is outside the current results, displays its hydrated label", async () => {
        // Arrange
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategories: [],
          totalCount: 0,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "get").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategory: {
            id: 8,
            fundingPeriodId: 3,
            categoryName: "Preschool diverse needs",
            fromAge: null,
            toAge: null,
            monthlyAmount: "54.9600",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
          policy: { show: true, create: true, update: true, destroy: false },
        })

        // Act
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete, {
          props: { modelValue: 8, fundingPeriodId: 3 },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-chip").text()).toBe("Preschool diverse needs")
      })
    })
  })
})
