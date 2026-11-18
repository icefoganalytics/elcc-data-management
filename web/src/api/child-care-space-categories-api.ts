import http from "@/api/http-client"
import {
  type FiltersOptions,
  type Policy,
  type QueryOptions,
  type WhereOptions,
} from "@/api/base-api"

export type ChildCareSpaceCategory = {
  id: number
  fundingPeriodId: number
  childCareCategoryId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type ChildCareSpaceCategoryPolicy = Policy

export type ChildCareSpaceCategoryAsIndex = ChildCareSpaceCategory
export type ChildCareSpaceCategoryAsShow = ChildCareSpaceCategory

export type ChildCareSpaceCategoryPropagationOptions = {
  applyToFutureMonths?: boolean
  propagationStartFiscalPeriodId?: number | null
}

export type ChildCareSpaceCategoryCreationAttributes = Pick<
  ChildCareSpaceCategory,
  "fundingPeriodId" | "childCareCategoryId" | "monthlyAmount"
> &
  ChildCareSpaceCategoryPropagationOptions

export type ChildCareSpaceCategoryUpdateAttributes = Partial<
  Pick<ChildCareSpaceCategory, "monthlyAmount">
> &
  ChildCareSpaceCategoryPropagationOptions

export type ChildCareSpaceCategoryWhereOptions = WhereOptions<
  ChildCareSpaceCategory,
  "id" | "fundingPeriodId" | "childCareCategoryId"
>

export type ChildCareSpaceCategoryFiltersOptions = FiltersOptions<{
  search: string | string[]
}>

export type ChildCareSpaceCategoryQueryOptions = QueryOptions<
  ChildCareSpaceCategoryWhereOptions,
  ChildCareSpaceCategoryFiltersOptions
>

export const childCareSpaceCategoriesApi = {
  async list(params: ChildCareSpaceCategoryQueryOptions = {}): Promise<{
    childCareSpaceCategories: ChildCareSpaceCategoryAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/child-care-space-categories", { params })
    return data
  },
  async get(childCareSpaceCategoryId: number): Promise<{
    childCareSpaceCategory: ChildCareSpaceCategoryAsShow
    policy: ChildCareSpaceCategoryPolicy
  }> {
    const { data } = await http.get(`/api/child-care-space-categories/${childCareSpaceCategoryId}`)
    return data
  },
  async create(attributes: ChildCareSpaceCategoryCreationAttributes): Promise<{
    childCareSpaceCategory: ChildCareSpaceCategoryAsShow
    policy: ChildCareSpaceCategoryPolicy
  }> {
    const { data } = await http.post("/api/child-care-space-categories", attributes)
    return data
  },
  async update(
    childCareSpaceCategoryId: number,
    attributes: ChildCareSpaceCategoryUpdateAttributes
  ): Promise<{
    childCareSpaceCategory: ChildCareSpaceCategoryAsShow
    policy: ChildCareSpaceCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/child-care-space-categories/${childCareSpaceCategoryId}`,
      attributes
    )
    return data
  },
  async delete(childCareSpaceCategoryId: number): Promise<void> {
    const { data } = await http.delete(
      `/api/child-care-space-categories/${childCareSpaceCategoryId}`
    )
    return data
  },
}

export default childCareSpaceCategoriesApi
