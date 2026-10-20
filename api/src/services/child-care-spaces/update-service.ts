import { IsolationLevel, type Attributes } from "@sequelize/core"

import db, { ChildCareSpace } from "@/models"
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
    return db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        await this.childCareSpace.reload({ transaction })
        await this.childCareSpace.update(this.attributes, { transaction })

        return this.childCareSpace.reload({ transaction })
      }
    )
  }
}

export default UpdateService
