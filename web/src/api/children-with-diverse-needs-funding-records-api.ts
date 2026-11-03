import http from "@/api/http-client"
import type { Policy, QueryOptions, WhereOptions } from "@/api/base-api"

export const CHILDREN_WITH_CHILDREN_WITH_DIVERSE_NEEDS_FUNDING_RECORDS_SECTION_NAME = "Children with Diverse Needs"

export type ChildrenWithDiverseNeedsFundingRecord = {
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

export type ChildrenWithDiverseNeedsFundingRecordPolicy = Policy
export type ChildrenWithDiverseNeedsFundingRecordAsIndex = ChildrenWithDiverseNeedsFundingRecord & {
  policy: ChildrenWithDiverseNeedsFundingRecordPolicy
}
export type ChildrenWithDiverseNeedsFundingRecordAsShow = ChildrenWithDiverseNeedsFundingRecord
export type ChildrenWithDiverseNeedsFundingRecordCreationAttributes = Pick<
  ChildrenWithDiverseNeedsFundingRecord,
  | "centreId"
  | "fiscalPeriodId"
  | "categoryId"
  | "estimatedChildOccupancyRate"
  | "actualChildOccupancyRate"
> & { applyToCurrentAndFutureFiscalPeriods?: boolean }
export type ChildrenWithDiverseNeedsFundingRecordWhereOptions = WhereOptions<
  ChildrenWithDiverseNeedsFundingRecord,
  "id" | "centreId" | "fiscalPeriodId" | "categoryId"
>
export type ChildrenWithDiverseNeedsFundingRecordQueryOptions = QueryOptions<
  ChildrenWithDiverseNeedsFundingRecordWhereOptions,
  never
>
export type ChildrenWithDiverseNeedsFundingRecordOccupancyAttributes = Partial<
  Pick<ChildrenWithDiverseNeedsFundingRecord, "estimatedChildOccupancyRate" | "actualChildOccupancyRate">
>

export const childrenWithChildrenWithDiverseNeedsFundingRecordsApi = {
  async list(
    params: ChildrenWithDiverseNeedsFundingRecordQueryOptions = {},
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecords: ChildrenWithDiverseNeedsFundingRecordAsIndex[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/children-with-diverse-needs-funding-records", { params, signal })
    return data
  },
  async create(attributes: ChildrenWithDiverseNeedsFundingRecordCreationAttributes): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecord: ChildrenWithDiverseNeedsFundingRecordAsShow
    policy: ChildrenWithDiverseNeedsFundingRecordPolicy
  }> {
    const { data } = await http.post("/api/children-with-diverse-needs-funding-records", attributes)
    return data
  },
  async get(
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId: number,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecord: ChildrenWithDiverseNeedsFundingRecordAsShow
    policy: ChildrenWithDiverseNeedsFundingRecordPolicy
  }> {
    const { data } = await http.get(
      `/api/children-with-diverse-needs-funding-records/${childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId}`,
      { signal }
    )
    return data
  },
  async update(
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId: number,
    attributes: ChildrenWithDiverseNeedsFundingRecordOccupancyAttributes
  ): Promise<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecord: ChildrenWithDiverseNeedsFundingRecordAsShow
    policy: ChildrenWithDiverseNeedsFundingRecordPolicy
  }> {
    const { data } = await http.patch(
      `/api/children-with-diverse-needs-funding-records/${childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId}`,
      attributes
    )
    return data
  },
  async delete(childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId: number): Promise<void> {
    const { data } = await http.delete(
      `/api/children-with-diverse-needs-funding-records/${childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId}`
    )
    return data
  },
}

export default childrenWithChildrenWithDiverseNeedsFundingRecordsApi
