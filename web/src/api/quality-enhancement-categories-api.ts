import http from "@/api/http-client"
import {
  type FiltersOptions,
  type Policy,
  type QueryOptions,
  type WhereOptions,
} from "@/api/base-api"

export type QualityEnhancementCategory = {
  id: number
  fundingPeriodId: number
  childCareCategoryId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
}

export type QualityEnhancementCategoryPolicy = Policy

export type QualityEnhancementCategoryAsIndex = QualityEnhancementCategory
export type QualityEnhancementCategoryAsShow = QualityEnhancementCategory

export type QualityEnhancementCategoryCreationAttributes = Pick<
  QualityEnhancementCategory,
  "fundingPeriodId" | "childCareCategoryId" | "monthlyAmount"
>

export type QualityEnhancementCategoryUpdateAttributes = Partial<
  Pick<QualityEnhancementCategory, "monthlyAmount">
>

export type QualityEnhancementCategoryWhereOptions = WhereOptions<
  QualityEnhancementCategory,
  "id" | "fundingPeriodId" | "childCareCategoryId"
>

export type QualityEnhancementCategoryFiltersOptions = FiltersOptions<{
  search: string | string[]
}>

export type QualityEnhancementCategoryQueryOptions = QueryOptions<
  QualityEnhancementCategoryWhereOptions,
  QualityEnhancementCategoryFiltersOptions
>

export const qualityEnhancementCategoriesApi = {
  async list(
    params: QualityEnhancementCategoryQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    qualityEnhancementCategories: QualityEnhancementCategoryAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/quality-enhancement-categories", { params, signal })
    return data
  },
  async get(
    qualityEnhancementCategoryId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    qualityEnhancementCategory: QualityEnhancementCategoryAsShow
    policy: QualityEnhancementCategoryPolicy
  }> {
    const { data } = await http.get(
      `/api/quality-enhancement-categories/${qualityEnhancementCategoryId}`,
      { signal }
    )
    return data
  },
  async create(attributes: QualityEnhancementCategoryCreationAttributes): Promise<{
    qualityEnhancementCategory: QualityEnhancementCategoryAsShow
    policy: QualityEnhancementCategoryPolicy
  }> {
    const { data } = await http.post("/api/quality-enhancement-categories", attributes)
    return data
  },
  async update(
    qualityEnhancementCategoryId: number,
    attributes: QualityEnhancementCategoryUpdateAttributes
  ): Promise<{
    qualityEnhancementCategory: QualityEnhancementCategoryAsShow
    policy: QualityEnhancementCategoryPolicy
  }> {
    const { data } = await http.patch(
      `/api/quality-enhancement-categories/${qualityEnhancementCategoryId}`,
      attributes
    )
    return data
  },
  async delete(qualityEnhancementCategoryId: number): Promise<void> {
    const { data } = await http.delete(
      `/api/quality-enhancement-categories/${qualityEnhancementCategoryId}`
    )
    return data
  },
}

export default qualityEnhancementCategoriesApi
