import { sql, type Attributes, type ModelStatic, type WhereOptions } from "@sequelize/core"
import Big from "big.js"

import { ChildCareSpace, User } from "@/models"
import ChildCareSpacePolicy from "@/policies/child-care-space-policy"
import { type BaseScopeOptions, type ModelOrder } from "@/controllers/base-controller"
import BaseService from "@/services/base-service"

export type ChildCareSpaceIndexSummaries = {
  totalEstimated: string
  totalActual: string
  totalEstimatedOccupancy: string
  totalActualOccupancy: string
}

export class IndexService extends BaseService {
  constructor(
    private where: WhereOptions<Attributes<ChildCareSpace>>,
    private scopes: BaseScopeOptions[],
    private order: ModelOrder[] | undefined,
    private limit: number,
    private offset: number,
    private currentUser: User
  ) {
    super()
  }

  async perform() {
    const scopedChildCareSpaces = ChildCareSpacePolicy.applyScope(this.scopes, this.currentUser)
    const totalCount = await scopedChildCareSpaces.count({ where: this.where })
    const childCareSpaces = await scopedChildCareSpaces.findAll({
      where: this.where,
      order: this.order,
      limit: this.limit,
      offset: this.offset,
    })
    const summaries = await this.buildSummaries(scopedChildCareSpaces, this.where)

    return {
      childCareSpaces,
      totalCount,
      summaries,
    }
  }

  private async buildSummaries(
    scopedChildCareSpaces: ModelStatic<ChildCareSpace>,
    where: WhereOptions<Attributes<ChildCareSpace>>
  ): Promise<ChildCareSpaceIndexSummaries> {
    const [summaries] = await scopedChildCareSpaces.findAll<
      ChildCareSpace,
      ChildCareSpaceIndexSummaries
    >({
      attributes: [
        [
          sql`CAST(COALESCE(SUM(${sql.attribute("estimatedComputedTotal")}), 0) AS VARCHAR(50))`,
          "totalEstimated",
        ],
        [
          sql`CAST(COALESCE(SUM(${sql.attribute("actualComputedTotal")}), 0) AS VARCHAR(50))`,
          "totalActual",
        ],
        [
          sql`CAST(COALESCE(SUM(${sql.attribute("estimatedChildOccupancyRate")}), 0) AS VARCHAR(50))`,
          "totalEstimatedOccupancy",
        ],
        [
          sql`CAST(COALESCE(SUM(${sql.attribute("actualChildOccupancyRate")}), 0) AS VARCHAR(50))`,
          "totalActualOccupancy",
        ],
      ],
      where,
      include: [{ association: "fiscalPeriod", attributes: [] }],
      raw: true,
    })

    return {
      totalEstimated: Big(summaries.totalEstimated).toFixed(4),
      totalActual: Big(summaries.totalActual).toFixed(4),
      totalEstimatedOccupancy: Big(summaries.totalEstimatedOccupancy).toFixed(4),
      totalActualOccupancy: Big(summaries.totalActualOccupancy).toFixed(4),
    }
  }
}

export default IndexService
