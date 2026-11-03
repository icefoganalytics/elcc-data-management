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
export type ChildrenWithDiverseNeedsFundingCategoryAsIndex = ChildrenWithDiverseNeedsFundingCategory
export type ChildrenWithDiverseNeedsFundingCategoryAsShow = ChildrenWithDiverseNeedsFundingCategory
export type ChildrenWithDiverseNeedsFundingCategoryCreationAttributes = Pick<
  ChildrenWithDiverseNeedsFundingCategory,
  "fundingPeriodId" | "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
>
export type ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes = Partial<
  Pick<ChildrenWithDiverseNeedsFundingCategory, "categoryName" | "fromAge" | "toAge" | "monthlyAmount">
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

export const childrenWithChildrenWithDiverseNeedsFundingRecordsCategoriesApi = {
  async list(
    params: ChildrenWithDiverseNeedsFundingCategoryQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategories: ChildrenWithDiverseNeedsFundingCategoryAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/children-with-diverse-needs-funding-categories", {
      params,
      signal,
    })
    return data
  },
  async get(
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }> {
    const { data } = await http.get(
      `/api/children-with-diverse-needs-funding-categories/${childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId}`,
      {
        signal,
      }
    )
    return data
  },
  async create(attributes: ChildrenWithDiverseNeedsFundingCategoryCreationAttributes): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }> {
    const { data } = await http.post("/api/children-with-diverse-needs-funding-categories", attributes)
    return data
  },
  async update(
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId: number,
    attributes: ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes
  ): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/children-with-diverse-needs-funding-categories/${childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId}`,
      attributes
    )
    return data
  },
  async delete(childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId: number): Promise<void> {
    const { data } = await http.delete(
      `/api/children-with-diverse-needs-funding-categories/${childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId}`
    )
    return data
  },
}

export default childrenWithChildrenWithDiverseNeedsFundingRecordsCategoriesApi
