import http from "@/api/http-client"

export const replicateEstimatesApi = {
  async create(administrationCostId: number): Promise<void> {
    const { data } = await http.post(
      `/api/administration-costs/${administrationCostId}/replicate-estimates`
    )
    return data
  },
}
