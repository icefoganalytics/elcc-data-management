import http from "@/api/http-client"
import type { FiltersOptions, Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export type DiverseNeedCategory = {
  id: number
  fundingPeriodId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
}

export type DiverseNeedCategoryPolicy = Policy
export type DiverseNeedCategoryAsIndex = DiverseNeedCategory
export type DiverseNeedCategoryAsShow = DiverseNeedCategory
export type DiverseNeedCategoryCreationAttributes = Pick<
  DiverseNeedCategory,
  "fundingPeriodId" | "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
>
export type DiverseNeedCategoryUpdateAttributes = Partial<
  Pick<DiverseNeedCategory, "categoryName" | "fromAge" | "toAge" | "monthlyAmount">
>
export type DiverseNeedCategoryWhereOptions = WhereOptions<
  DiverseNeedCategory,
  "id" | "fundingPeriodId" | "categoryName" | "fromAge" | "toAge"
>
export type DiverseNeedCategoryFiltersOptions = FiltersOptions<{ search: string | string[] }>
export type DiverseNeedCategoryQueryOptions = QueryOptions<
  DiverseNeedCategoryWhereOptions,
  DiverseNeedCategoryFiltersOptions
>

export const diverseNeedCategoriesApi = {
  async list(
    params: DiverseNeedCategoryQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{ diverseNeedCategories: DiverseNeedCategoryAsIndex[]; totalCount: number }> {
    const { data } = await http.get("/api/diverse-need-categories", { params, signal })
    return data
  },
  async get(
    diverseNeedCategoryId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    diverseNeedCategory: DiverseNeedCategoryAsShow
    policy: DiverseNeedCategoryPolicy
  }> {
    const { data } = await http.get(`/api/diverse-need-categories/${diverseNeedCategoryId}`, {
      signal,
    })
    return data
  },
  async create(attributes: DiverseNeedCategoryCreationAttributes): Promise<{
    diverseNeedCategory: DiverseNeedCategoryAsShow
    policy: DiverseNeedCategoryPolicy
  }> {
    const { data } = await http.post("/api/diverse-need-categories", attributes)
    return data
  },
  async update(
    diverseNeedCategoryId: number,
    attributes: DiverseNeedCategoryUpdateAttributes
  ): Promise<{
    diverseNeedCategory: DiverseNeedCategoryAsShow
    policy: DiverseNeedCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/diverse-need-categories/${diverseNeedCategoryId}`,
      attributes
    )
    return data
  },
  async delete(diverseNeedCategoryId: number): Promise<void> {
    const { data } = await http.delete(`/api/diverse-need-categories/${diverseNeedCategoryId}`)
    return data
  },
}

export default diverseNeedCategoriesApi
