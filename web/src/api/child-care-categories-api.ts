import http from "@/api/http-client"
import {
  type FiltersOptions,
  type Policy,
  type QueryOptions,
  type WhereOptions,
} from "@/api/base-api"

export type ChildCareCategory = {
  id: number
  fundingPeriodId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type ChildCareCategoryPolicy = Policy

export type ChildCareCategoryAsIndex = ChildCareCategory
export type ChildCareCategoryAsShow = ChildCareCategory

export type ChildCareCategoryCreationAttributes = Pick<
  ChildCareCategory,
  "fundingPeriodId" | "categoryName" | "fromAge" | "toAge"
>

export type ChildCareCategoryUpdateAttributes = Partial<
  Pick<ChildCareCategory, "categoryName" | "fromAge" | "toAge">
>

export type ChildCareCategoryWhereOptions = WhereOptions<
  ChildCareCategory,
  "id" | "fundingPeriodId" | "categoryName" | "fromAge" | "toAge"
>

export type ChildCareCategoryFiltersOptions = FiltersOptions<{
  search: string | string[]
}>

export type ChildCareCategoryQueryOptions = QueryOptions<
  ChildCareCategoryWhereOptions,
  ChildCareCategoryFiltersOptions
>

export const childCareCategoriesApi = {
  async list(
    params: ChildCareCategoryQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childCareCategories: ChildCareCategoryAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/child-care-categories", { params, signal })
    return data
  },
  async get(
    childCareCategoryId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childCareCategory: ChildCareCategoryAsShow
    policy: ChildCareCategoryPolicy
  }> {
    const { data } = await http.get(`/api/child-care-categories/${childCareCategoryId}`, { signal })
    return data
  },
  async create(attributes: ChildCareCategoryCreationAttributes): Promise<{
    childCareCategory: ChildCareCategoryAsShow
    policy: ChildCareCategoryPolicy
  }> {
    const { data } = await http.post("/api/child-care-categories", attributes)
    return data
  },
  async update(
    childCareCategoryId: number,
    attributes: ChildCareCategoryUpdateAttributes
  ): Promise<{
    childCareCategory: ChildCareCategoryAsShow
    policy: ChildCareCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/child-care-categories/${childCareCategoryId}`,
      attributes
    )
    return data
  },
  async delete(childCareCategoryId: number): Promise<void> {
    const { data } = await http.delete(`/api/child-care-categories/${childCareCategoryId}`)
    return data
  },
}

export default childCareCategoriesApi
