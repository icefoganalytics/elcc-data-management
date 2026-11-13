import { AxiosHeaders } from "axios"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

import useSnack from "@/use/use-snack"

import { childrenWithDiverseNeedsFundingCategoryFactory } from "@/tests/factories"
import { mockHttpGetRoutes, mockRouter, mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategoryPage from "@/pages/administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage.vue"

describe("web/src/pages/administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoryPage", () => {
    describe("retirement recovery", () => {
      test("when retirement is challenged, delivers the original challenge to the application boundary", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
          policy: {
            show: true,
            create: true,
            update: false,
            destroy: true,
          },
        })
        const challengeError = new CloudflareChallengeError({
          status: 403,
          statusText: "Forbidden",
          headers: {
            "cf-mitigated": "challenge",
          },
          config: {
            headers: new AxiosHeaders(),
          },
          data: "<html>Browser verification required</html>",
        })
        const receivedErrors: unknown[] = []
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: {
              childrenWithDiverseNeedsFundingCategory: category,
              policy: category.policy,
            },
          }),
          "/api/funding-periods/3": () => ({
            data: {
              fundingPeriod: {
                id: 3,
                fiscalYear: "2026-2027",
              },
              policy: {},
            },
          }),
        })
        vi.spyOn(window, "confirm").mockReturnValue(true)
        vi.mocked(httpClient.delete).mockRejectedValue(challengeError)
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoryPage,
          },
          {
            path: "/categories",
            name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryPage, {
          props: {
            childrenWithDiverseNeedsFundingCategoryId: "8",
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

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(receivedErrors).toEqual([challengeError])
      })

      test("when retirement is rejected, enables the retirement action for another attempt", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
          policy: {
            show: true,
            create: true,
            update: false,
            destroy: true,
          },
        })
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: {
              childrenWithDiverseNeedsFundingCategory: category,
              policy: category.policy,
            },
          }),
          "/api/funding-periods/3": () => ({
            data: {
              fundingPeriod: {
                id: 3,
                fiscalYear: "2026-2027",
              },
              policy: {},
            },
          }),
        })
        vi.spyOn(window, "confirm").mockReturnValue(true)
        vi.mocked(httpClient.delete).mockRejectedValue(new ApiOperationError("In use", 422))
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoryPage,
          },
          {
            path: "/categories",
            name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryPage, {
          props: {
            childrenWithDiverseNeedsFundingCategoryId: "8",
          },
          global: {
            plugins: [router, mockVuetify()],
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get("button").attributes("disabled")).toBeUndefined()
      })

      test("when retirement returns an ordinary operation error, shows local retirement feedback", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
          policy: {
            show: true,
            create: true,
            update: false,
            destroy: true,
          },
        })
        const operationError = new ApiOperationError("In use", 422)
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: {
              childrenWithDiverseNeedsFundingCategory: category,
              policy: category.policy,
            },
          }),
          "/api/funding-periods/3": () => ({
            data: {
              fundingPeriod: {
                id: 3,
                fiscalYear: "2026-2027",
              },
              policy: {},
            },
          }),
        })
        vi.spyOn(window, "confirm").mockReturnValue(true)
        vi.mocked(httpClient.delete).mockRejectedValue(operationError)
        const router = mockRouter([
          {
            path: "/",
            component: ChildrenWithDiverseNeedsFundingCategoryPage,
          },
          {
            path: "/categories",
            name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
            component: {
              template: "<div />",
            },
          },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryPage, {
          props: {
            childrenWithDiverseNeedsFundingCategoryId: "8",
          },
          global: {
            plugins: [router, mockVuetify()],
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(useSnack().message.value).toContain("In use")
      })
    })
  })
})
