import { computed, defineComponent } from "vue"
import { flushPromises } from "@vue/test-utils"

import useRouteQueriableTableOptions from "@/use/utils/use-route-queriable-table-options"

import { mockRouter, mountWithDefaultPlugins } from "@/tests/support"

function createProbe<T extends Record<string, unknown>>(setup: () => T) {
  return defineComponent({ setup, template: "<div />" })
}

describe("web/src/use/utils/use-route-queriable-table-options.ts", () => {
  describe("useRouteQueriableTableOptions", () => {
    describe("route-backed options", () => {
      test("when a bookmark selects All and nested sorting, restores the API query", async () => {
        // Arrange
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push(
          "/?pageCategories=3&perPageCategories=-1&sortByCategories=fundingPeriod.fiscalYear_desc&sortByCategories=categoryName_asc"
        )
        await router.isReady()
        const component = createProbe(() => {
          const { page, perPage, order } = useRouteQueriableTableOptions({
            routeQuerySuffix: "Categories",
            sortBy: [{ key: "categoryName", order: "asc" }],
          })
          const query = computed(() => ({
            page: page.value,
            perPage: perPage.value,
            order: order.value,
          }))
          return { query }
        })

        // Act
        const wrapper = mountWithDefaultPlugins(component, { router })

        // Assert
        expect(wrapper.vm.query).toEqual({
          page: 3,
          perPage: -1,
          order: [
            ["fundingPeriod", "fiscalYear", "DESC"],
            ["categoryName", "ASC"],
          ],
        })
      })

      test("when sorting is cleared and remounted, does not restore the default order", async () => {
        // Arrange
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        const component = createProbe(() =>
          useRouteQueriableTableOptions({
            sortBy: [{ key: "categoryName", order: "asc" }],
          })
        )
        const wrapper = mountWithDefaultPlugins(component, { router })

        // Act
        wrapper.vm.sortBy = []
        await flushPromises()
        const clearedLocation = router.currentRoute.value.fullPath
        wrapper.unmount()
        await router.push("/")
        await router.push(clearedLocation)
        const remountedWrapper = mountWithDefaultPlugins(component, { router })

        // Assert
        expect(remountedWrapper.vm.order).toBeUndefined()
      })

      test("when one table changes, preserves the other table and unrelated filters", async () => {
        // Arrange
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push(
          "/?pageCategories=2&perPageCategories=25&pageRecords=4&sortByRecords=monthlyAmount_desc&fundingPeriodId=5"
        )
        await router.isReady()
        const component = createProbe(() => {
          const categories = useRouteQueriableTableOptions({ routeQuerySuffix: "Categories" })
          const records = useRouteQueriableTableOptions({ routeQuerySuffix: "Records" })
          return { categories, records }
        })
        const wrapper = mountWithDefaultPlugins(component, { router })

        // Act
        wrapper.vm.categories.page.value = 3
        wrapper.vm.categories.perPage.value = -1
        wrapper.vm.categories.sortBy.value = [{ key: "categoryName", order: "desc" }]
        await flushPromises()

        // Assert
        expect(router.currentRoute.value.query).toEqual({
          pageCategories: "3",
          perPageCategories: "-1",
          sortByCategories: ["categoryName_desc"],
          pageRecords: "4",
          sortByRecords: "monthlyAmount_desc",
          fundingPeriodId: "5",
        })
      })

      test("when history returns to an earlier bookmark, restores its pagination and order", async () => {
        // Arrange
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/?page=2&perPage=25&sortBy=categoryName_desc")
        await router.isReady()
        const component = createProbe(() => {
          const { page, perPage, order } = useRouteQueriableTableOptions()
          const query = computed(() => ({
            page: page.value,
            perPage: perPage.value,
            order: order.value,
          }))
          return { query }
        })
        const wrapper = mountWithDefaultPlugins(component, { router })
        await router.push("/?page=5&perPage=10")

        // Act
        router.back()
        await flushPromises()

        // Assert
        expect(wrapper.vm.query).toEqual({
          page: 2,
          perPage: 25,
          order: [["categoryName", "DESC"]],
        })
      })
    })
  })
})
