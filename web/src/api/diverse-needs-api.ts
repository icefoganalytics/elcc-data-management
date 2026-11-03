import http from "@/api/http-client"
import type { Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export const DIVERSE_NEEDS_SECTION_NAME = "Children with Diverse Needs"

export type DiverseNeed = {
  id: number
  centreId: number
  fiscalPeriodId: number
  categoryId: number
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal: string
  actualComputedTotal: string
  createdAt: string
  updatedAt: string
}

export type DiverseNeedPolicy = Policy
export type DiverseNeedAsIndex = DiverseNeed & { policy: DiverseNeedPolicy }
export type DiverseNeedAsShow = DiverseNeed
export type DiverseNeedCreationAttributes = Pick<
  DiverseNeed,
  | "centreId"
  | "fiscalPeriodId"
  | "categoryId"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
> & { applyToCurrentAndFutureFiscalPeriods?: boolean }
export type DiverseNeedWhereOptions = WhereOptions<
  DiverseNeed,
  "id" | "centreId" | "fiscalPeriodId" | "categoryId"
>
export type DiverseNeedQueryOptions = QueryOptions<DiverseNeedWhereOptions, never>
export type DiverseNeedOccupancyAttributes = Partial<
  Pick<DiverseNeed, "estimatedChildOccupancyRate" | "actualChildOccupancyRate">
>

export const diverseNeedsApi = {
  async list(
    params: DiverseNeedQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{ diverseNeeds: DiverseNeedAsIndex[]; totalCount: number }> {
    const { data } = await http.get("/api/diverse-needs", { params, signal })
    return data
  },
  async create(attributes: DiverseNeedCreationAttributes): Promise<{
    diverseNeed: DiverseNeedAsShow
    policy: DiverseNeedPolicy
  }> {
    const { data } = await http.post("/api/diverse-needs", attributes)
    return data
  },
  async get(
    diverseNeedId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    diverseNeed: DiverseNeedAsShow
    policy: DiverseNeedPolicy
  }> {
    const { data } = await http.get(`/api/diverse-needs/${diverseNeedId}`, { signal })
    return data
  },
  async update(
    diverseNeedId: number,
    attributes: DiverseNeedOccupancyAttributes
  ): Promise<{ diverseNeed: DiverseNeedAsShow; policy: DiverseNeedPolicy }> {
    const { data } = await http.patch(`/api/diverse-needs/${diverseNeedId}`, attributes)
    return data
  },
  async delete(diverseNeedId: number): Promise<void> {
    const { data } = await http.delete(`/api/diverse-needs/${diverseNeedId}`)
    return data
  },
}

export default diverseNeedsApi
