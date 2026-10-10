import http from "@/api/http-client"
import {
  type FiltersOptions,
  type Policy,
  type QueryOptions,
  type WhereOptions,
} from "@/api/base-api"

export const CHILD_CARE_SPACES_SECTION_NAME = "Child Care Spaces"

export type ChildCareSpace = {
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

export type ChildCareSpacePolicy = Policy

export type ChildCareSpaceAsShow = ChildCareSpace

export type ChildCareSpaceAsIndex = ChildCareSpace & {
  policy: ChildCareSpacePolicy
}

export type ChildCareSpaceWhereOptions = WhereOptions<
  ChildCareSpace,
  "id" | "centreId" | "fiscalPeriodId" | "categoryId"
>

export type ChildCareSpaceFiltersOptions = FiltersOptions<{
  byFiscalYear: string
}>

export type ChildCareSpaceQueryOptions = QueryOptions<
  ChildCareSpaceWhereOptions,
  ChildCareSpaceFiltersOptions
>

export type ChildCareSpaceUpdateAttributes = Partial<
  Pick<ChildCareSpace, "estimatedChildOccupancyRate" | "actualChildOccupancyRate">
>

export const childCareSpacesApi = {
  async list(params: ChildCareSpaceQueryOptions = {}): Promise<{
    childCareSpaces: ChildCareSpaceAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/child-care-spaces", { params })
    return data
  },
  async get(childCareSpaceId: number): Promise<{
    childCareSpace: ChildCareSpaceAsShow
    policy: ChildCareSpacePolicy
  }> {
    const { data } = await http.get(`/api/child-care-spaces/${childCareSpaceId}`)
    return data
  },
  async update(
    childCareSpaceId: number,
    attributes: ChildCareSpaceUpdateAttributes
  ): Promise<{
    childCareSpace: ChildCareSpaceAsShow
    policy: ChildCareSpacePolicy
  }> {
    const { data } = await http.patch(`/api/child-care-spaces/${childCareSpaceId}`, attributes)
    return data
  },
  async replicateEstimates(childCareSpaceId: number): Promise<void> {
    const { data } = await http.post(
      `/api/child-care-spaces/${childCareSpaceId}/replicate-estimates`
    )
    return data
  },
}

export default childCareSpacesApi
