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
export type AdministrationCostAsIndex = AdministrationCost
export type AdministrationCostAsShow = AdministrationCost
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
  ): Promise<{
    administrationCosts: AdministrationCostAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/administration-costs", {
      params,
      signal,
    })
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
}

export default administrationCostsApi
