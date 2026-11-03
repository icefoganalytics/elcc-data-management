import http from "@/api/http-client"
import type { FiltersOptions, Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export const QUALITY_ENHANCEMENTS_SECTION_NAME = "Quality Enhancement Program"

export type QualityEnhancement = {
  id: number
  centreId: number
  fiscalPeriodId: number
  categoryId: number
  childCareSpaceCategoryId: number | null
  lineName: string
  baseMonthlyAmount: string
  hotMealIncrementAmount: string
  hotMealAppliedAt: string | null
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal: string
  actualComputedTotal: string
  createdAt: string
  updatedAt: string
}

export type QualityEnhancementPolicy = Policy
export type QualityEnhancementAsShow = QualityEnhancement
export type QualityEnhancementCreationAttributes = Pick<
  QualityEnhancement,
  | "centreId"
  | "fiscalPeriodId"
  | "categoryId"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
> & { applyToCurrentAndFutureFiscalPeriods?: boolean }
export type QualityEnhancementAsIndex = QualityEnhancement & { policy: QualityEnhancementPolicy }
export type QualityEnhancementWhereOptions = WhereOptions<
  QualityEnhancement,
  "id" | "centreId" | "fiscalPeriodId" | "categoryId"
>
export type QualityEnhancementFiltersOptions = FiltersOptions<{ byFiscalYear: string }>
export type QualityEnhancementQueryOptions = QueryOptions<
  QualityEnhancementWhereOptions,
  QualityEnhancementFiltersOptions
>
export type QualityEnhancementUpdateAttributes = Partial<
  Pick<QualityEnhancement, "estimatedChildOccupancyRate" | "actualChildOccupancyRate">
>

export const qualityEnhancementsApi = {
  async list(
    params: QualityEnhancementQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{ qualityEnhancements: QualityEnhancementAsIndex[]; totalCount: number }> {
    const { data } = await http.get("/api/quality-enhancements", { params, signal })
    return data
  },
  async create(attributes: QualityEnhancementCreationAttributes): Promise<{
    qualityEnhancement: QualityEnhancementAsShow
    policy: QualityEnhancementPolicy
  }> {
    const { data } = await http.post("/api/quality-enhancements", attributes)
    return data
  },
  async get(
    qualityEnhancementId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    qualityEnhancement: QualityEnhancementAsShow
    policy: QualityEnhancementPolicy
  }> {
    const { data } = await http.get(`/api/quality-enhancements/${qualityEnhancementId}`, { signal })
    return data
  },
  async update(
    qualityEnhancementId: number,
    attributes: QualityEnhancementUpdateAttributes
  ): Promise<{
    qualityEnhancement: QualityEnhancementAsShow
    policy: QualityEnhancementPolicy
  }> {
    const { data } = await http.patch(
      `/api/quality-enhancements/${qualityEnhancementId}`,
      attributes
    )
    return data
  },
  async delete(qualityEnhancementId: number): Promise<void> {
    const { data } = await http.delete(`/api/quality-enhancements/${qualityEnhancementId}`)
    return data
  },
  async replicateEstimates(qualityEnhancementId: number): Promise<void> {
    const { data } = await http.post(
      `/api/quality-enhancements/${qualityEnhancementId}/replicate-estimates`
    )
    return data
  },
}

export default qualityEnhancementsApi
