import http from "@/api/http-client"
import type { FiltersOptions, Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export type ChildrenWithDiverseNeedsFundingCategory = {
  id: number
  fundingPeriodId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
}

export type ChildrenWithDiverseNeedsFundingCategoryPolicy = Policy

export type ChildrenWithDiverseNeedsFundingCategoryAsIndex =
  ChildrenWithDiverseNeedsFundingCategory & {
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }

export type ChildrenWithDiverseNeedsFundingCategoryAsShow = ChildrenWithDiverseNeedsFundingCategory

export type ChildrenWithDiverseNeedsFundingCategoryCreationAttributes = Pick<
  ChildrenWithDiverseNeedsFundingCategory,
  "fundingPeriodId" | "categoryName" | "monthlyAmount"
> &
  Partial<Pick<ChildrenWithDiverseNeedsFundingCategory, "fromAge" | "toAge">>

export type ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes = Partial<
  Pick<
    ChildrenWithDiverseNeedsFundingCategory,
    "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
  >
>

export type ChildrenWithDiverseNeedsFundingCategoryWhereOptions = WhereOptions<
  ChildrenWithDiverseNeedsFundingCategory,
  "id" | "fundingPeriodId" | "categoryName" | "fromAge" | "toAge"
>

export type ChildrenWithDiverseNeedsFundingCategoryFiltersOptions = FiltersOptions<{
  search: string | string[]
}>

export type ChildrenWithDiverseNeedsFundingCategoryQueryOptions = QueryOptions<
  ChildrenWithDiverseNeedsFundingCategoryWhereOptions,
  ChildrenWithDiverseNeedsFundingCategoryFiltersOptions
>

export const childrenWithDiverseNeedsFundingCategoriesApi = {
  async list(
    params: ChildrenWithDiverseNeedsFundingCategoryQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childrenWithDiverseNeedsFundingCategories: ChildrenWithDiverseNeedsFundingCategoryAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/children-with-diverse-needs-funding-categories", {
      params,
      signal,
    })
    return data
  },

  async get(
    childrenWithDiverseNeedsFundingCategoryId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }> {
    const { data } = await http.get(
      `/api/children-with-diverse-needs-funding-categories/${childrenWithDiverseNeedsFundingCategoryId}`,
      {
        signal,
      }
    )
    return data
  },

  async create(attributes: ChildrenWithDiverseNeedsFundingCategoryCreationAttributes): Promise<{
    childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }> {
    const { data } = await http.post(
      "/api/children-with-diverse-needs-funding-categories",
      attributes
    )
    return data
  },

  async update(
    childrenWithDiverseNeedsFundingCategoryId: number,
    attributes: ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes
  ): Promise<{
    childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/children-with-diverse-needs-funding-categories/${childrenWithDiverseNeedsFundingCategoryId}`,
      attributes
    )
    return data
  },

  async delete(childrenWithDiverseNeedsFundingCategoryId: number): Promise<void> {
    const { data } = await http.delete(
      `/api/children-with-diverse-needs-funding-categories/${childrenWithDiverseNeedsFundingCategoryId}`
    )
    return data
  },
}

export default childrenWithDiverseNeedsFundingCategoriesApi
