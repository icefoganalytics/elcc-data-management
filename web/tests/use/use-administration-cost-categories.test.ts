import { type GenericAbortSignal } from "axios"
import { effectScope, ref } from "vue"
import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import type {
  AdministrationCostCategoryAsIndex,
  AdministrationCostCategoryQueryOptions,
} from "@/api/administration-cost-categories-api"

import { administrationCostCategoryFactory } from "@/tests/factories"

import useAdministrationCostCategories from "@/use/use-administration-cost-categories"

type CategoryListResponse = {
  data: {
    administrationCostCategories: AdministrationCostCategoryAsIndex[]
    totalCount: number
  }
}

describe("web/src/use/use-administration-cost-categories.ts", () => {
  describe("useAdministrationCostCategories", () => {
    describe("request lifecycle", () => {
      test("when the query changes, aborts the previous category request", async ({
        onTestFinished,
      }) => {
        // Arrange
        const pendingRequest = Promise.withResolvers<CategoryListResponse>()
        let previousSignal: GenericAbortSignal | undefined
        vi.mocked(httpClient, true).get.mockImplementationOnce((_url, options) => {
          previousSignal = options?.signal
          return pendingRequest.promise
        })
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: {
            administrationCostCategories: [],
            totalCount: 0,
          },
        })
        const query = ref<AdministrationCostCategoryQueryOptions>({
          where: {
            fundingPeriodId: 1,
          },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        scope.run(() => useAdministrationCostCategories(query))

        // Act
        query.value = {
          where: {
            fundingPeriodId: 2,
          },
        }
        await flushPromises()

        // Assert
        expect(previousSignal?.aborted).toEqual(true)
      })

      test("when an aborted response arrives late, retains the selected funding period's categories", async ({
        onTestFinished,
      }) => {
        // Arrange
        const previousCategory = administrationCostCategoryFactory.build({
          id: 1,
          fundingPeriodId: 1,
          categoryName: "Previous-year Infants",
        })
        const selectedCategory = administrationCostCategoryFactory.build({
          id: 2,
          fundingPeriodId: 2,
          categoryName: "Current-year Toddlers",
        })
        const pendingRequest = Promise.withResolvers<CategoryListResponse>()
        vi.mocked(httpClient, true).get.mockReturnValueOnce(pendingRequest.promise)
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: {
            administrationCostCategories: [selectedCategory],
            totalCount: 1,
          },
        })
        const query = ref<AdministrationCostCategoryQueryOptions>({
          where: {
            fundingPeriodId: 1,
          },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const categories = scope.run(() => useAdministrationCostCategories(query))
        if (!categories) throw new Error("Expected an active category collection")

        // Act
        query.value = {
          where: {
            fundingPeriodId: 2,
          },
        }
        await flushPromises()
        pendingRequest.resolve({
          data: {
            administrationCostCategories: [previousCategory],
            totalCount: 1,
          },
        })
        await flushPromises()

        // Assert
        expect(categories.administrationCostCategories.value).toEqual([selectedCategory])
      })
    })
  })
})
