import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"

import { administrationCostCategoryFactory } from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import AdministrationCostCategoryPage from "@/pages/administration/administration-cost-categories/AdministrationCostCategoryPage.vue"

describe("web/src/pages/administration/administration-cost-categories/AdministrationCostCategoryPage.vue", () => {
  describe("AdministrationCostCategoryPage", () => {
    describe("load recovery", () => {
      test("when a failed category load is retried successfully, displays the recovered record", async () => {
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

          return { data: { fundingPeriods: [], totalCount: 0 } }
        })
        const router = mockRouter([{ path: "/", component: AdministrationCostCategoryPage }])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoryPage, {
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
        expect(wrapper.text()).toContain("Recovered Administration Category")
      })
    })
  })
})
