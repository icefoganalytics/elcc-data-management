import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"

import { administrationCostCategoryFactory } from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import AdministrationCostCategoriesDataTableServer from "@/components/administration-cost-categories/AdministrationCostCategoriesDataTableServer.vue"

describe("web/src/components/administration-cost-categories/AdministrationCostCategoriesDataTableServer.vue", () => {
  describe("AdministrationCostCategoriesDataTableServer", () => {
    describe("shared category sorting", () => {
      test("when From Age is clicked, stores its association sort key in the URL", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValue({
          data: { administrationCostCategories: [], totalCount: 0 },
        })
        const router = mockRouter([
          { path: "/", component: AdministrationCostCategoriesDataTableServer },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoriesDataTableServer, {
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get("thead th:nth-child(2)").trigger("click")
        await flushPromises()

        // Assert
        await expect.poll(() => router.currentRoute.value.query.sortBy).toEqual([
          "childCareCategory.fromAge_asc",
        ])
      })
    })

    describe("shared metadata display", () => {
      test("when shared metadata is serialized flat, renders its name, zero age and missing upper age", async () => {
        // Arrange
        const category = administrationCostCategoryFactory.build({
          categoryName: "Infants",
          fromAge: 0,
          toAge: null,
        })
        vi.mocked(httpClient, true).get.mockResolvedValue({
          data: { administrationCostCategories: [category], totalCount: 1 },
        })
        const router = mockRouter([
          { path: "/", component: AdministrationCostCategoriesDataTableServer },
          {
            path: "/categories/:administrationCostCategoryId",
            name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(AdministrationCostCategoriesDataTableServer, {
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Assert
        expect(
          wrapper
            .findAll("tbody tr:first-child td")
            .slice(0, 3)
            .map((cell) => cell.text())
        ).toEqual(["Infants", "0", "—"])
      })
    })

    describe("funding-period changes", () => {
      test("when the funding period changes on a later page, displays the new period's first page", async () => {
        // Arrange
        const previousCategory = administrationCostCategoryFactory.build({
          fundingPeriodId: 1,
          categoryName: "Previous-period category",
        })
        const currentPeriodCategories = administrationCostCategoryFactory.buildList(25, {
          fundingPeriodId: 2,
        })
        currentPeriodCategories[0].categoryName = "Current-period first category"
        vi.mocked(httpClient, true).get.mockImplementation(async (_url, config) => {
          const { where, page = 1, perPage = 10 } = config?.params ?? {}
          if (where?.fundingPeriodId === 2) {
            return {
              data: {
                administrationCostCategories: currentPeriodCategories.slice(
                  (page - 1) * perPage,
                  page * perPage
                ),
                totalCount: 25,
              },
            }
          }

          return {
            data: { administrationCostCategories: [previousCategory], totalCount: 25 },
          }
        })
        const router = mockRouter([
          { path: "/", component: AdministrationCostCategoriesDataTableServer },
          {
            path: "/categories/:administrationCostCategoryId",
            name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/?page=3")
        await router.isReady()
        const wrapper = mount(AdministrationCostCategoriesDataTableServer, {
          props: { where: { fundingPeriodId: 1 } },
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.setProps({ where: { fundingPeriodId: 2 } })
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody").text()).toContain("Current-period first category")
      })
    })
  })
})
