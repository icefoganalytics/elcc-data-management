import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"

import useSnack from "@/use/use-snack"

import { childrenWithDiverseNeedsFundingCategoryFactory } from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategoriesDataTableServer from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue"

describe("web/src/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoriesDataTableServer", () => {
    describe("pagination", () => {
      test("when the next page loads, displays its records without resetting to page one", async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
        onTestFinished(() => {
          vi.useRealTimers()
        })

        const category1 = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 1,
          categoryName: "First page category",
        })
        const category2 = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 11,
          categoryName: "Second page category",
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockImplementation(
          async (query) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 100))
            return {
              childrenWithDiverseNeedsFundingCategories: [
                query?.page === 2 ? category2 : category1,
              ],
              totalCount: 20,
            }
          }
        )
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer,
          },
          {
            path: "/categories/:childrenWithDiverseNeedsFundingCategoryId",
            name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
            component: {
              template: "<div>Category details</div>",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          global: {
            plugins: [router, mockVuetify()],
          },
        })
        await vi.advanceTimersByTimeAsync(100)
        await flushPromises()

        // Act
        await wrapper.get('button[aria-label="Next page"]').trigger("click")
        await flushPromises()
        await vi.advanceTimersByTimeAsync(100)
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody").text()).toContain("Second page category")
      })
    })

    describe("loading categories", () => {
      beforeEach(() => {
        const snack = useSnack()
        snack.reset()
      })

      afterEach(() => {
        const snack = useSnack()
        snack.reset()
      })

      test("when loading requires authentication, delivers the original error to application recovery", async () => {
        // Arrange
        const authenticationError = new AuthenticationRequiredError()
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockRejectedValue(
          authenticationError
        )
        const receivedErrors: unknown[] = []
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer,
          },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: {
            where: {
              fundingPeriodId: 5,
            },
          },
          global: {
            plugins: [router, mockVuetify()],
            config: {
              errorHandler(error) {
                receivedErrors.push(error)
              },
            },
          },
        })
        await flushPromises()

        // Assert
        expect(receivedErrors).toEqual([
          expect.objectContaining({ message: "You must be logged in to access this endpoint" }),
        ])
      })

      test("when loading fails with an operation error, displays load-failure feedback", async () => {
        // Arrange
        const snack = useSnack()
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockRejectedValue(
          new ApiOperationError("Categories are unavailable", 503)
        )
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer,
          },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: {
            where: {
              fundingPeriodId: 5,
            },
          },
          global: {
            plugins: [router, mockVuetify()],
          },
        })
        await flushPromises()

        // Assert
        expect(snack.message.value).toBe("Failed to load Children with Diverse Needs categories.")
      })

      test("when loading fails, leaves the table's normal empty state visible", async () => {
        // Arrange
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockRejectedValue(
          new ApiOperationError("Categories are unavailable", 503)
        )
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer,
          },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: {
            where: {
              fundingPeriodId: 5,
            },
          },
          global: {
            plugins: [router, mockVuetify()],
          },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody").text()).toBe("No data available")
      })
    })
  })
})
