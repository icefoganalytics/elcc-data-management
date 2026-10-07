import { type Attributes } from "@sequelize/core"

import { ChildCareSpace } from "@/models"
import BaseService from "@/services/base-service"

export type ChildCareSpaceUpdateAttributes = Pick<
  Attributes<ChildCareSpace>,
  "estimatedChildOccupancyRate" | "actualChildOccupancyRate"
>

export class UpdateService extends BaseService {
  constructor(
    private childCareSpace: ChildCareSpace,
    private attributes: Partial<ChildCareSpaceUpdateAttributes>
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpace> {
    await this.childCareSpace.update(this.attributes)

    return this.childCareSpace
  }
}

export default UpdateService
