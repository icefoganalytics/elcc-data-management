import http from "@/api/http-client"

export const replicateEstimatesApi = {
  async create(childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId: number): Promise<void> {
    const { data } = await http.post(
      `/api/children-with-diverse-needs-funding-records/${childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId}/replicate-estimates`
    )
    return data
  },
}

export default replicateEstimatesApi
