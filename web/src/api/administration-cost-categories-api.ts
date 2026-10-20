import http from "@/api/http-client"
import type { FiltersOptions, Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export type AdministrationCostCategory = {
  id: number
  fundingPeriodId: number
  childCareSpaceCategoryId: number | null
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type AdministrationCostCategoryPolicy = Policy
export type AdministrationCostCategoryAsIndex = AdministrationCostCategory
export type AdministrationCostCategoryAsShow = AdministrationCostCategory

export type AdministrationCostCategoryCreationAttributes = Pick<
  AdministrationCostCategory,
  | "fundingPeriodId"
  | "childCareSpaceCategoryId"
  | "categoryName"
  | "fromAge"
  | "toAge"
  | "monthlyAmount"
>

export type AdministrationCostCategoryUpdateAttributes = Partial<
  Pick<
    AdministrationCostCategory,
    "childCareSpaceCategoryId" | "categoryName" | "fromAge" | "toAge" | "monthlyAmount"
  >
>

export type AdministrationCostCategoryWhereOptions = WhereOptions<
  AdministrationCostCategory,
  "id" | "fundingPeriodId" | "childCareSpaceCategoryId" | "categoryName" | "fromAge" | "toAge"
>

export type AdministrationCostCategoryFiltersOptions = FiltersOptions<{ search: string | string[] }>
export type AdministrationCostCategoryQueryOptions = QueryOptions<
  AdministrationCostCategoryWhereOptions,
  AdministrationCostCategoryFiltersOptions
>

export const administrationCostCategoriesApi = {
  async list(params: AdministrationCostCategoryQueryOptions = {}): Promise<{
    administrationCostCategories: AdministrationCostCategoryAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/administration-cost-categories", { params })
    return data
  },
  async get(administrationCostCategoryId: number): Promise<{
    administrationCostCategory: AdministrationCostCategoryAsShow
    policy: AdministrationCostCategoryPolicy
  }> {
    const { data } = await http.get(
      `/api/administration-cost-categories/${administrationCostCategoryId}`
    )
    return data
  },
  async create(attributes: AdministrationCostCategoryCreationAttributes): Promise<{
    administrationCostCategory: AdministrationCostCategoryAsShow
    policy: AdministrationCostCategoryPolicy
  }> {
    const { data } = await http.post("/api/administration-cost-categories", attributes)
    return data
  },
  async update(
    administrationCostCategoryId: number,
    attributes: AdministrationCostCategoryUpdateAttributes
  ): Promise<{
    administrationCostCategory: AdministrationCostCategoryAsShow
    policy: AdministrationCostCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/administration-cost-categories/${administrationCostCategoryId}`,
      attributes
    )
    return data
  },
  async delete(administrationCostCategoryId: number): Promise<void> {
    const { data } = await http.delete(
      `/api/administration-cost-categories/${administrationCostCategoryId}`
    )
    return data
  },
}

export default administrationCostCategoriesApi
