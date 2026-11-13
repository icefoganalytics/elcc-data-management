import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"

import { childrenWithDiverseNeedsFundingCategoryFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue"

describe("web/src/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete", () => {
    describe("selected category hydration", () => {
      test("when the selected category is outside the current results, displays its hydrated label", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
          categoryName: "Preschool diverse needs",
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategories: [],
          totalCount: 0,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "get").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategory: category,
          policy: category.policy,
        })

        // Act
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete, {
          props: { modelValue: 8, fundingPeriodId: 3 },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-chip").text()).toBe("Preschool diverse needs")
      })
    })
  })
})
