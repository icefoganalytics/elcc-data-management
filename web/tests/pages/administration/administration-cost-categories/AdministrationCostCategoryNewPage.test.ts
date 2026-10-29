import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"
import { VTextField } from "vuetify/components"

import httpClient from "@/api/http-client"
import type { ChildCareSpaceCategoryAsIndex } from "@/api/child-care-space-categories-api"

import { mockRouter, mockVuetify } from "@/tests/support"

import CurrencyInput from "@/components/CurrencyInput.vue"
import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"
import AdministrationCostCategoryNewPage from "@/pages/administration/administration-cost-categories/AdministrationCostCategoryNewPage.vue"

describe("web/src/pages/administration/administration-cost-categories/AdministrationCostCategoryNewPage.vue", () => {
  describe("AdministrationCostCategoryNewPage", () => {
    describe("linked category selection", () => {
      test("when another funding period is loading, does not offer the previous period's categories", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.stubGlobal("visualViewport", undefined)
        onTestFinished(() => {
          vi.unstubAllGlobals()
        })
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
                  {
                    id: 1,
                    fiscalYear: "2024-2025",
                  },
                  {
                    id: 2,
                    fiscalYear: "2025-2026",
                  },
                ],
                totalCount: 2,
              },
            }
          }
          if (url === "/api/funding-periods/1" || url === "/api/funding-periods/2") {
            const id = Number(url.split("/").at(-1))
            return {
              data: {
                fundingPeriod: { id, fiscalYear: id === 1 ? "2024-2025" : "2025-2026" },
                policy: {},
              },
            }
          }
          if (
            url === "/api/child-care-space-categories" &&
            config?.params?.where?.fundingPeriodId === 1
          ) {
            return {
              data: {
                childCareSpaceCategories: [previousCategory],
                totalCount: 1,
              },
            }
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
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoryNewPage, {
          attachTo: document.body,
          global: {
            plugins: [router, createPinia(), mockVuetify()],
          },
        })
        await flushPromises()
        const fundingPeriodSelect = wrapper.getComponent(FundingPeriodSearchableAutocomplete)
        const linkedCategorySelect = wrapper.getComponent(
          ChildCareSpaceCategorySearchableAutocomplete
        )
        await fundingPeriodSelect.setValue(1)
        await flushPromises()
        await linkedCategorySelect.setValue(10)
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
      })
    })

    describe("creation", () => {
      test("when an optional age is cleared, sends null while preserving numeric ages and exact money", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.stubGlobal("visualViewport", undefined)
        onTestFinished(() => {
          vi.unstubAllGlobals()
        })
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/funding-periods") {
            return {
              data: { fundingPeriods: [{ id: 1, fiscalYear: "2024-2025" }], totalCount: 1 },
            }
          }
          if (url === "/api/funding-periods/1") {
            return {
              data: { fundingPeriod: { id: 1, fiscalYear: "2024-2025" }, policy: {} },
            }
          }
          if (url === "/api/child-care-space-categories") {
            return { data: { childCareSpaceCategories: [], totalCount: 0 } }
          }

          throw new Error(`Unexpected GET ${url}`)
        })
        vi.mocked(httpClient, true).post.mockResolvedValue({
          data: { administrationCostCategory: { id: 7 } },
        })
        const router = mockRouter([
          {
            path: "/",
            name: "administration/AdministrationCostCategoriesPage",
            component: { template: "<div />" },
          },
          {
            path: "/categories/:administrationCostCategoryId",
            name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoryNewPage, {
          attachTo: document.body,
          global: { plugins: [router, createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.getComponent(FundingPeriodSearchableAutocomplete).setValue(1)
        const fields = wrapper.findAllComponents(VTextField)
        await fields
          .filter((field) => field.props("label") === "Category Name *")[0]
          .setValue("QA Administration")
        const fromAgeField = fields.filter((field) => field.props("label") === "From Age")[0]
        await fromAgeField.setValue("2")
        await fromAgeField.setValue("")
        await fields.filter((field) => field.props("label") === "To Age")[0].setValue("5")
        await wrapper.getComponent(CurrencyInput).setValue("42.1234")
        await flushPromises()

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(httpClient.post).toHaveBeenCalledExactlyOnceWith(
          "/api/administration-cost-categories",
          {
            fundingPeriodId: 1,
            childCareSpaceCategoryId: null,
            categoryName: "QA Administration",
            fromAge: null,
            toAge: 5,
            monthlyAmount: "42.1234",
          }
        )
      })
    })
  })
})
