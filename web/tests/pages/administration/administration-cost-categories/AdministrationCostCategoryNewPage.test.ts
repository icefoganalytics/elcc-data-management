import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"
import { VSelect } from "vuetify/components"

import httpClient from "@/api/http-client"
import type { ChildCareSpaceCategoryAsIndex } from "@/api/child-care-space-categories-api"
import AdministrationCostCategoryNewPage from "@/pages/administration/administration-cost-categories/AdministrationCostCategoryNewPage.vue"
import { mockRouter, mockVuetify } from "@/tests/support"

describe("web/src/pages/administration/administration-cost-categories/AdministrationCostCategoryNewPage.vue", () => {
  describe("AdministrationCostCategoryNewPage", () => {
    describe("linked category selection", () => {
      test("when another funding period is loading, does not offer the previous period's categories", async () => {
        // Arrange
        vi.stubGlobal("visualViewport", undefined)
        const pendingCategories = Promise.withResolvers<{
          data: { childCareSpaceCategories: ChildCareSpaceCategoryAsIndex[]; totalCount: number }
        }>()
        const previousCategory: ChildCareSpaceCategoryAsIndex = {
          id: 10,
          fundingPeriodId: 1,
          categoryName: "Previous-year Infants",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "700.0000",
          createdAt: "2024-04-01T00:00:00Z",
          updatedAt: "2024-04-01T00:00:00Z",
          deletedAt: null,
        }
        vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
          if (url === "/api/funding-periods") {
            return {
              data: {
                fundingPeriods: [
                  { id: 1, fiscalYear: "2024-2025" },
                  { id: 2, fiscalYear: "2025-2026" },
                ],
                totalCount: 2,
              },
            }
          }
          if (
            url === "/api/child-care-space-categories" &&
            config?.params?.where?.fundingPeriodId === 1
          ) {
            return { data: { childCareSpaceCategories: [previousCategory], totalCount: 1 } }
          }
          if (url === "/api/child-care-space-categories") {
            return pendingCategories.promise
          }

          throw new Error(`Unexpected GET ${url}`)
        })
        const router = mockRouter([
          {
            path: "/",
            name: "administration/AdministrationCostCategoriesPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoryNewPage, {
          attachTo: document.body,
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        try {
          await flushPromises()
          const fundingPeriodSelect = wrapper.findAllComponents(VSelect)[0]
          const linkedCategorySelect = wrapper.findAllComponents(VSelect)[1]
          await fundingPeriodSelect.setValue(1)
          await flushPromises()

          // Act
          await fundingPeriodSelect.setValue(2)
          await flushPromises()
          await linkedCategorySelect.get(".v-field").trigger("mousedown")
          await flushPromises()

          // Assert
          const offeredCategories = Array.from(document.querySelectorAll('[role="option"]'))
          const offeredCategoryNames = offeredCategories.map((option) => option.textContent)
          expect(offeredCategoryNames).not.toContain("Previous-year Infants")
        } finally {
          pendingCategories.resolve({ data: { childCareSpaceCategories: [], totalCount: 0 } })
          await flushPromises()
          wrapper.unmount()
          vi.unstubAllGlobals()
        }
      })
    })
  })
})
