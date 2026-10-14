import { effectScope, ref, type EffectScope, type Ref } from "vue"
import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { type ChildCareSpaceCategoryAsShow } from "@/api/child-care-space-categories-api"
import useChildCareSpaceCategory from "@/use/use-child-care-space-category"

type CategoryResponse = {
  data: {
    childCareSpaceCategory: ChildCareSpaceCategoryAsShow
    policy: Record<string, never>
  }
}

const category1: ChildCareSpaceCategoryAsShow = {
  id: 1,
  fundingPeriodId: 10,
  categoryName: "Infants",
  fromAge: 0,
  toAge: 18,
  monthlyAmount: "100.0000",
  createdAt: "2024-04-01",
  updatedAt: "2024-04-01",
  deletedAt: null,
}
const category2: ChildCareSpaceCategoryAsShow = {
  id: 2,
  fundingPeriodId: 10,
  categoryName: "Toddlers",
  fromAge: 19,
  toAge: 36,
  monthlyAmount: "200.0000",
  createdAt: "2024-04-01",
  updatedAt: "2024-04-01",
  deletedAt: null,
}

const scopes: EffectScope[] = []
afterEach(() => {
  for (const scope of scopes) {
    scope.stop()
  }
  scopes.length = 0
})

function loadCategory(categoryId: Ref<number | null>) {
  const scope = effectScope()
  scopes.push(scope)
  const category = scope.run(() => useChildCareSpaceCategory(categoryId))
  if (category === undefined) {
    throw new Error("Category scope did not start")
  }

  return category
}

function categoryResponse(category: ChildCareSpaceCategoryAsShow): CategoryResponse {
  return { data: { childCareSpaceCategory: category, policy: {} } }
}

describe("web/src/use/use-child-care-space-category.ts", () => {
  describe("useChildCareSpaceCategory", () => {
    describe("identity changes", () => {
      test("when another category is loading, rejects saving attributes from the previous category", async () => {
        // Arrange
        const category2Request = Promise.withResolvers<CategoryResponse>()
        vi.mocked(httpClient, true)
          .get.mockResolvedValueOnce(categoryResponse(category1))
          .mockReturnValueOnce(category2Request.promise)
        const categoryId = ref<number | null>(1)
        const category = loadCategory(categoryId)
        await flushPromises()

        // Act
        categoryId.value = 2
        await flushPromises()

        // Assert
        await expect(category.save()).rejects.toThrow(
          "The requested Child Care Space category is not loaded"
        )
      })

      test("when an earlier category response arrives last, retains the requested category", async () => {
        // Arrange
        const category1Request = Promise.withResolvers<CategoryResponse>()
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(category1Request.promise)
          .mockResolvedValueOnce(categoryResponse(category2))
        const categoryId = ref<number | null>(1)
        const category = loadCategory(categoryId)

        // Act
        categoryId.value = 2
        await flushPromises()
        category1Request.resolve(categoryResponse(category1))
        await flushPromises()

        // Assert
        expect(category.childCareSpaceCategory.value).toEqual(category2)
      })

      test("when a save completes after navigation, retains the newly requested category", async () => {
        // Arrange
        const saveRequest = Promise.withResolvers<CategoryResponse>()
        vi.mocked(httpClient, true)
          .get.mockResolvedValueOnce(categoryResponse(category1))
          .mockResolvedValueOnce(categoryResponse(category2))
        vi.mocked(httpClient, true).patch.mockReturnValueOnce(saveRequest.promise)
        const categoryId = ref<number | null>(1)
        const category = loadCategory(categoryId)
        await flushPromises()
        const save = category.save()

        // Act
        categoryId.value = 2
        await flushPromises()
        saveRequest.resolve(categoryResponse(category1))
        await save

        // Assert
        expect(category.childCareSpaceCategory.value).toEqual(category2)
      })

      test("when the requested identity is cleared, removes the previous category", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce(categoryResponse(category1))
        const categoryId = ref<number | null>(1)
        const category = loadCategory(categoryId)
        await flushPromises()

        // Act
        categoryId.value = null
        await flushPromises()

        // Assert
        expect(category.childCareSpaceCategory.value).toBeNull()
      })
    })
  })
})
