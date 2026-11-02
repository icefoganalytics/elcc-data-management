import { IsolationLevel, type Attributes, type Transaction } from "@sequelize/core"
import Big from "big.js"

import db, { AdministrationCost, ChildCareSpace, QualityEnhancement } from "@/models"
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
        const occupancyChanged =
          (this.attributes.estimatedChildOccupancyRate !== undefined &&
            !new Big(this.childCareSpace.estimatedChildOccupancyRate).eq(
              this.attributes.estimatedChildOccupancyRate
            )) ||
          (this.attributes.actualChildOccupancyRate !== undefined &&
            !new Big(this.childCareSpace.actualChildOccupancyRate).eq(
              this.attributes.actualChildOccupancyRate
            ))

        await this.childCareSpace.update(this.attributes, { transaction })
        if (occupancyChanged) {
          await this.updateLinkedOccupancy(transaction)
        }

        return this.childCareSpace.reload({ transaction })
      }
    )
  }

  private async updateLinkedOccupancy(transaction: Transaction): Promise<void> {
    const { centreId, fiscalPeriodId, categoryId } = this.childCareSpace
    const where = { centreId, fiscalPeriodId, childCareSpaceCategoryId: categoryId }
    const occupancy = {
      estimatedChildOccupancyRate: this.childCareSpace.estimatedChildOccupancyRate,
      actualChildOccupancyRate: this.childCareSpace.actualChildOccupancyRate,
    }

    await AdministrationCost.findEach({ where, transaction }, async (administrationCost) => {
      await administrationCost.update(occupancy, { transaction })
    })
    await QualityEnhancement.findEach({ where, transaction }, async (qualityEnhancement) => {
      await qualityEnhancement.update(occupancy, { transaction })
    })
  }
}

export default UpdateService
