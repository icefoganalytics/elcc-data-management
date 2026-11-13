import { type Attributes, type WhereOptions } from "@sequelize/core"

import { Centre, User } from "@/models"
import CentrePolicy from "@/policies/centre-policy"
import { type BaseScopeOptions, type ModelOrder } from "@/controllers/base-controller"

import BaseService from "@/services/base-service"

export type CentreIndexSummaries = {
  communityCount: number
}

export class IndexService extends BaseService {
  constructor(
    private where: WhereOptions<Attributes<Centre>>,
    private scopes: BaseScopeOptions[],
    private order: ModelOrder[] | undefined,
    private limit: number,
    private offset: number,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<{
    centres: Centre[]
    totalCount: number
    summaries: CentreIndexSummaries
  }> {
    const scopedCentres = CentrePolicy.applyScope(this.scopes, this.currentUser)
    const totalCount = await scopedCentres.count({ where: this.where })
    const centres = await scopedCentres.findAll({
      where: this.where,
      order: this.order,
      limit: this.limit,
      offset: this.offset,
    })
    const communityCount = await scopedCentres.count({
      where: this.where,
      distinct: true,
      col: "community",
    })

    return {
      centres,
      totalCount,
      summaries: { communityCount },
    }
  }
}

export default IndexService
