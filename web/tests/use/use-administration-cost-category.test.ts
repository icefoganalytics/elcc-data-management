import { effectScope, ref } from "vue"
import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { type AdministrationCostCategoryAsShow } from "@/api/administration-cost-categories-api"
import useAdministrationCostCategory from "@/use/use-administration-cost-category"

const category1: AdministrationCostCategoryAsShow = {
  id: 1,
  fundingPeriodId: 10,
  childCareSpaceCategoryId: null,
  categoryName: "Infants",
  fromAge: 0,
  toAge: 1,
  monthlyAmount: "70.0000",
  createdAt: "2024-04-01",
  updatedAt: "2024-04-01",
  deletedAt: null,
}
const category2: AdministrationCostCategoryAsShow = {
  id: 2,
  fundingPeriodId: 10,
  childCareSpaceCategoryId: null,
  categoryName: "Toddlers",
  fromAge: 2,
  toAge: 3,
  monthlyAmount: "80.0000",
  createdAt: "2024-04-01",
  updatedAt: "2024-04-01",
  deletedAt: null,
}

describe("web/src/use/use-administration-cost-category.ts", () => {
  describe("useAdministrationCostCategory", () => {
    describe("identity changes", () => {
      test("when a save finishes after navigation, retains the newly requested category", async () => {
        // Arrange
        const pendingSave = Promise.withResolvers<{
          data: { administrationCostCategory: AdministrationCostCategoryAsShow; policy: object }
        }>()
        vi.mocked(httpClient, true)
          .get.mockResolvedValueOnce({
            data: { administrationCostCategory: category1, policy: {} },
          })
          .mockResolvedValueOnce({ data: { administrationCostCategory: category2, policy: {} } })
        vi.mocked(httpClient, true).patch.mockReturnValueOnce(pendingSave.promise)
        const categoryId = ref<number | null>(1)
        const scope = effectScope()
        const category = scope.run(() => useAdministrationCostCategory(categoryId))
        if (category === undefined) throw new Error("Category scope did not start")

        try {
          await flushPromises()
          const save = category.save({ monthlyAmount: "90.0000" })

          // Act
          categoryId.value = 2
          await flushPromises()
          pendingSave.resolve({ data: { administrationCostCategory: category1, policy: {} } })
          await save

          // Assert
          expect(category.administrationCostCategory.value).toEqual(category2)
        } finally {
          scope.stop()
        }
      })

      test("when the next category has not loaded, rejects saving the previous category's attributes", async () => {
        // Arrange
        const pendingLoad = Promise.withResolvers<{
          data: { administrationCostCategory: AdministrationCostCategoryAsShow; policy: object }
        }>()
        vi.mocked(httpClient, true)
          .get.mockResolvedValueOnce({
            data: { administrationCostCategory: category1, policy: {} },
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
          const save = category.save({ categoryName: "Previous category" })

          // Assert
          await expect(save).rejects.toThrow(
            "The requested Administration cost category is not loaded"
          )
        } finally {
          scope.stop()
        }
      })
    })
  })
})
