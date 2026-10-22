import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import type { ChildCareSpaceCategoryAsIndex } from "@/api/child-care-space-categories-api"
import ChildCareSpaceCategoriesDataTableServer from "@/components/child-care-space-categories/ChildCareSpaceCategoriesDataTableServer.vue"
import { mockRouter, mockVuetify } from "@/tests/support"

type CategoryListResponse = {
  data: {
    childCareSpaceCategories: ChildCareSpaceCategoryAsIndex[]
    totalCount: number
  }
}

describe("web/src/components/child-care-space-categories/ChildCareSpaceCategoriesDataTableServer.vue", () => {
  describe("ChildCareSpaceCategoriesDataTableServer", () => {
    describe("filter changes", () => {
      test("when an older filtered response arrives last, renders the newest results", async () => {
        // Arrange
        const olderRequest = Promise.withResolvers<CategoryListResponse>()
        const newestRequest = Promise.withResolvers<CategoryListResponse>()
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(olderRequest.promise)
          .mockReturnValueOnce(newestRequest.promise)
        const router = mockRouter([
          { path: "/", component: ChildCareSpaceCategoriesDataTableServer },
          {
            path: "/categories/:childCareSpaceCategoryId",
            name: "administration/child-care-space-categories/ChildCareSpaceCategoryPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildCareSpaceCategoriesDataTableServer, {
          props: { filters: { search: "older" } },
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.setProps({ filters: { search: "newest" } })
        await flushPromises()
        newestRequest.resolve({
          data: {
            childCareSpaceCategories: [
              {
                id: 2,
                fundingPeriodId: 10,
                categoryName: "Newest category",
                fromAge: 0,
                toAge: 3,
                monthlyAmount: "100.0000",
                createdAt: "2024-04-01",
                updatedAt: "2024-04-01",
                deletedAt: null,
              },
            ],
            totalCount: 1,
          },
        })
        await flushPromises()
        olderRequest.resolve({
          data: {
            childCareSpaceCategories: [
              {
                id: 1,
                fundingPeriodId: 10,
                categoryName: "Older category",
                fromAge: 0,
                toAge: 3,
                monthlyAmount: "100.0000",
                createdAt: "2024-04-01",
                updatedAt: "2024-04-01",
                deletedAt: null,
              },
            ],
            totalCount: 1,
          },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody").text()).toContain("Newest category")
      })
    })
  })
})
