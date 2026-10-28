import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import type { FundingPeriod } from "@/api/funding-periods-api"

import { mockRouter, mockVuetify } from "@/tests/support"

import AdministrationCostCategoriesPage from "@/pages/administration/AdministrationCostCategoriesPage.vue"

describe("web/src/pages/administration/AdministrationCostCategoriesPage.vue", () => {
  describe("AdministrationCostCategoriesPage", () => {
    describe("creation availability", () => {
      test("when no funding periods exist, does not offer category creation", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/funding-periods") {
            return {
              data: {
                fundingPeriods: [],
                totalCount: 0,
              },
            }
          }
          if (url === "/api/administration-cost-categories") {
            return {
              data: {
                administrationCostCategories: [],
                totalCount: 0,
              },
            }
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
          {
            path: "/new",
            name: "administration/administration-cost-categories/AdministrationCostCategoryNewPage",
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(AdministrationCostCategoriesPage, {
          global: {
            plugins: [router, createPinia(), mockVuetify()],
          },
        })
        await flushPromises()

        // Assert
        expect(wrapper.find('a[href="/new"]').exists()).toEqual(false)
      })

      test("when a funding period exists and the filter is cleared, still offers category creation", async () => {
        // Arrange
        const fundingPeriod: FundingPeriod = {
          id: 1,
          fiscalYear: "2026-2027",
          title: "2026-2027 Funding",
          fromDate: "2026-04-01",
          toDate: "2027-03-31",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }
        vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
          if (url === "/api/funding-periods") {
            return {
              data: {
                fundingPeriods: [fundingPeriod],
                totalCount: 1,
              },
            }
          }
          if (url === "/api/funding-periods/1") {
            return {
              data: {
                fundingPeriod,
                policy: {},
              },
            }
          }
          if (url === "/api/administration-cost-categories") {
            return {
              data: {
                administrationCostCategories: [],
                totalCount: 0,
              },
            }
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
          {
            path: "/new",
            name: "administration/administration-cost-categories/AdministrationCostCategoryNewPage",
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoriesPage, {
          global: {
            plugins: [router, createPinia(), mockVuetify()],
          },
        })
        await flushPromises()

        // Act
        await wrapper.get('.v-field__clearable [role="button"]').trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.find('a[href="/new"]').exists()).toEqual(true)
      })
    })
  })
})
