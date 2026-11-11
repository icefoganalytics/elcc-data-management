import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"

import { mockRouter, mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategoriesDataTableServer from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue"

describe("web/src/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoriesDataTableServer", () => {
    describe("load recovery", () => {
      test("when retry requires authentication after a load failure, delivers the original error to application recovery", async () => {
        // Arrange
        const authenticationError = new AuthenticationRequiredError()
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list")
          .mockRejectedValueOnce(new ApiOperationError("Categories are unavailable", 503))
          .mockRejectedValueOnce(authenticationError)
        const receivedErrors: unknown[] = []
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: { where: { fundingPeriodId: 5 } },
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

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(receivedErrors).toEqual([authenticationError])
      })

      test("when retry fails with an operation error, keeps the retry action available", async () => {
        // Arrange
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockRejectedValue(
          new ApiOperationError("Categories are unavailable", 503)
        )
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: { where: { fundingPeriodId: 5 } },
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get("button").element.disabled).toBe(false)
      })
    })
  })
})
