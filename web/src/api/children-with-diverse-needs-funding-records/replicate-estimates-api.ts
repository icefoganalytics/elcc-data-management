import http from "@/api/http-client"

export const replicateEstimatesApi = {
  async create(childrenWithDiverseNeedsFundingRecordId: number): Promise<void> {
    const { data } = await http.post(
      `/api/children-with-diverse-needs-funding-records/${childrenWithDiverseNeedsFundingRecordId}/replicate-estimates`
    )
    return data
  },
}

export default replicateEstimatesApi
