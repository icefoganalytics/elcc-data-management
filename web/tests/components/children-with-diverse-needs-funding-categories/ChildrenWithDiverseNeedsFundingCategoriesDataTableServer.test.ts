import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"

import useSnack from "@/use/use-snack"

import { mockRouter, mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategoriesDataTableServer from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue"

describe("web/src/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoriesDataTableServer", () => {
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
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
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

        // Assert
        expect(receivedErrors).toEqual([authenticationError])
      })

      test("when loading fails with an operation error, shows snackbar feedback", async () => {
        // Arrange
        const snack = useSnack()
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockRejectedValue(
          new ApiOperationError("Categories are unavailable", 503)
        )
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: { where: { fundingPeriodId: 5 } },
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Assert
        expect(snack.message.value).toContain("Categories are unavailable")
      })

      test("when loading fails, leaves the table's normal empty state visible", async () => {
        // Arrange
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockRejectedValue(
          new ApiOperationError("Categories are unavailable", 503)
        )
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoriesDataTableServer },
        ])
        await router.push("/")
        await router.isReady()

        // Act
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoriesDataTableServer, {
          props: { where: { fundingPeriodId: 5 } },
          global: { plugins: [router, mockVuetify()] },
        })
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody").text()).toBe("No data available")
      })
    })
  })
})
