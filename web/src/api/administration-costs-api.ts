import http from "@/api/http-client"
import type { Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export const ADMINISTRATION_SECTION_NAME = "Administration (10% of Spaces)"

export type AdministrationCost = {
  id: number
  centreId: number
  fiscalPeriodId: number
  categoryId: number
  childCareSpaceCategoryId: number | null
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal: string
  actualComputedTotal: string
  createdAt: string
  updatedAt: string
}

export type AdministrationCostPolicy = Policy
export type AdministrationCostAsIndex = AdministrationCost & { policy: AdministrationCostPolicy }
export type AdministrationCostAsShow = AdministrationCost
export type AdministrationCostCreationAttributes = Pick<
  AdministrationCost,
  | "centreId"
  | "fiscalPeriodId"
  | "categoryId"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
> & { applyToCurrentAndFutureFiscalPeriods?: boolean }
export type AdministrationCostWhereOptions = WhereOptions<
  AdministrationCost,
  "id" | "centreId" | "fiscalPeriodId" | "categoryId"
>
export type AdministrationCostQueryOptions = QueryOptions<AdministrationCostWhereOptions, never>
export type AdministrationCostOccupancyAttributes = Partial<
  Pick<AdministrationCost, "estimatedChildOccupancyRate" | "actualChildOccupancyRate">
>

export const administrationCostsApi = {
  async list(
    params: AdministrationCostQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{ administrationCosts: AdministrationCostAsIndex[]; totalCount: number }> {
    const { data } = await http.get("/api/administration-costs", { params, signal })
    return data
  },
  async create(attributes: AdministrationCostCreationAttributes): Promise<{
    administrationCost: AdministrationCostAsShow
    policy: AdministrationCostPolicy
  }> {
    const { data } = await http.post("/api/administration-costs", attributes)
    return data
  },
  async get(administrationCostId: number): Promise<{
    administrationCost: AdministrationCostAsShow
    policy: AdministrationCostPolicy
  }> {
    const { data } = await http.get(`/api/administration-costs/${administrationCostId}`)
    return data
  },
  async update(
    administrationCostId: number,
    attributes: AdministrationCostOccupancyAttributes
  ): Promise<{ administrationCost: AdministrationCostAsShow; policy: AdministrationCostPolicy }> {
    const { data } = await http.patch(
      `/api/administration-costs/${administrationCostId}`,
      attributes
    )
    return data
  },
  async delete(administrationCostId: number): Promise<void> {
    const { data } = await http.delete(`/api/administration-costs/${administrationCostId}`)
    return data
  },
  async replicateEstimates(administrationCostId: number): Promise<void> {
    const { data } = await http.post(
      `/api/administration-costs/${administrationCostId}/replicate-estimates`
    )
    return data
  },
}

export default administrationCostsApi
