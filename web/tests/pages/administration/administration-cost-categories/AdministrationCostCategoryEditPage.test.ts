import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"
import { VTextField } from "vuetify/components"

import httpClient from "@/api/http-client"

import { administrationCostCategoryFactory } from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import AdministrationCostCategoryEditPage from "@/pages/administration/administration-cost-categories/AdministrationCostCategoryEditPage.vue"

describe("web/src/pages/administration/administration-cost-categories/AdministrationCostCategoryEditPage.vue", () => {
  describe("AdministrationCostCategoryEditPage", () => {
    describe("load recovery", () => {
      test("when a failed category load is retried successfully, restores the editable record", async () => {
        // Arrange
        const category = administrationCostCategoryFactory.build({
          id: 42,
          categoryName: "Recovered Administration Category",
        })
        let shouldFail = true
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/administration-cost-categories/42") {
            if (shouldFail) throw new Error("Category unavailable")

            return { data: { administrationCostCategory: category, policy: {} } }
          }
          if (url === "/api/child-care-space-categories") {
            return { data: { childCareSpaceCategories: [], totalCount: 0 } }
          }

          return { data: { fundingPeriods: [], totalCount: 0 } }
        })
        const router = mockRouter([
          { path: "/", component: AdministrationCostCategoryEditPage },
          {
            path: "/categories/:administrationCostCategoryId",
            name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoryEditPage, {
          props: { administrationCostCategoryId: "42" },
          global: {
            plugins: [createPinia(), router, mockVuetify()],
            config: {
              errorHandler(error) {
                if (error instanceof Error && error.message === "Category unavailable") return

                throw error
              },
            },
          },
        })
        await flushPromises()

        // Act
        shouldFail = false
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        const categoryNameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        expect(categoryNameField?.props("modelValue")).toEqual("Recovered Administration Category")
      })
    })
  })
})
