import http from "@/api/http-client"

export const replicateEstimatesApi = {
  async create(diverseNeedId: number): Promise<void> {
    const { data } = await http.post(`/api/diverse-needs/${diverseNeedId}/replicate-estimates`)
    return data
  },
}

export default replicateEstimatesApi
