import { type GenericAbortSignal } from "axios"
import { effectScope, ref } from "vue"
import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { type AdministrationCostCategoryAsShow } from "@/api/administration-cost-categories-api"

import { administrationCostCategoryFactory } from "@/tests/factories"

import useAdministrationCostCategory from "@/use/use-administration-cost-category"

describe("web/src/use/use-administration-cost-category.ts", () => {
  describe("useAdministrationCostCategory", () => {
    describe("identity changes", () => {
      test("when a save finishes after navigation, retains the newly requested category", async () => {
        // Arrange
        const category1 = administrationCostCategoryFactory.build({
          id: 1,
          fundingPeriodId: 10,
          categoryName: "Infants",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "70.0000",
        })
        const category2 = administrationCostCategoryFactory.build({
          id: 2,
          fundingPeriodId: 10,
          categoryName: "Toddlers",
          fromAge: 2,
          toAge: 3,
          monthlyAmount: "80.0000",
        })
        const pendingSave = Promise.withResolvers<{
          data: { administrationCostCategory: AdministrationCostCategoryAsShow; policy: object }
        }>()
        vi.mocked(httpClient, true)
          .get.mockResolvedValueOnce({
            data: {
              administrationCostCategory: category1,
              policy: {},
            },
          })
          .mockResolvedValueOnce({
            data: {
              administrationCostCategory: category2,
              policy: {},
            },
          })
        vi.mocked(httpClient, true).patch.mockReturnValueOnce(pendingSave.promise)
        const categoryId = ref<number | null>(1)
        const scope = effectScope()
        const category = scope.run(() => useAdministrationCostCategory(categoryId))
        if (category === undefined) throw new Error("Category scope did not start")

        try {
          await flushPromises()
          const save = category.save({
            monthlyAmount: "90.0000",
          })

          // Act
          categoryId.value = 2
          await flushPromises()
          pendingSave.resolve({
            data: {
              administrationCostCategory: category1,
              policy: {},
            },
          })
          await save

          // Assert
          expect(category.administrationCostCategory.value).toEqual(category2)
        } finally {
          scope.stop()
        }
      })

      test("when the next category has not loaded, rejects saving the previous category's attributes", async () => {
        // Arrange
        const category1 = administrationCostCategoryFactory.build({
          id: 1,
          fundingPeriodId: 10,
          categoryName: "Infants",
          monthlyAmount: "70.0000",
        })
        const pendingLoad = Promise.withResolvers<{
          data: { administrationCostCategory: AdministrationCostCategoryAsShow; policy: object }
        }>()
        vi.mocked(httpClient, true)
          .get.mockResolvedValueOnce({
            data: {
              administrationCostCategory: category1,
              policy: {},
            },
          })
          .mockReturnValueOnce(pendingLoad.promise)
        const categoryId = ref<number | null>(1)
        const scope = effectScope()
        const category = scope.run(() => useAdministrationCostCategory(categoryId))
        if (category === undefined) throw new Error("Category scope did not start")

        try {
          await flushPromises()
          categoryId.value = 2
          await flushPromises()

          // Act
          const save = category.save({
            categoryName: "Previous category",
          })

          // Assert
          await expect(save).rejects.toThrow()
        } finally {
          scope.stop()
        }
      })

      test("when the selected category is cleared, aborts its pending read", async ({
        onTestFinished,
      }) => {
        // Arrange
        const pendingRequest = Promise.withResolvers<{
          data: { administrationCostCategory: AdministrationCostCategoryAsShow; policy: object }
        }>()
        let requestSignal: GenericAbortSignal | undefined
        vi.mocked(httpClient, true).get.mockImplementationOnce((_url, options) => {
          requestSignal = options?.signal
          return pendingRequest.promise
        })
        const categoryId = ref<number | null>(1)
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        scope.run(() => useAdministrationCostCategory(categoryId))

        // Act
        categoryId.value = null
        await flushPromises()

        // Assert
        expect(requestSignal?.aborted).toEqual(true)
      })
    })
  })
})
