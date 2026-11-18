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
        const changedOccupancy = this.buildChangedOccupancy(this.childCareSpace, this.attributes)

        await this.childCareSpace.update(this.attributes, { transaction })
        if (Object.keys(changedOccupancy).length > 0) {
          await this.updateLinkedOccupancy(this.childCareSpace, changedOccupancy, transaction)
        }

        return this.childCareSpace.reload({ transaction })
      }
    )
  }

  private buildChangedOccupancy(
    childCareSpace: ChildCareSpace,
    attributes: Partial<ChildCareSpaceUpdateAttributes>
  ): Partial<ChildCareSpaceUpdateAttributes> {
    const changedOccupancy: Partial<ChildCareSpaceUpdateAttributes> = {}
    if (
      attributes.estimatedChildOccupancyRate !== undefined &&
      !new Big(childCareSpace.estimatedChildOccupancyRate).eq(attributes.estimatedChildOccupancyRate)
    ) {
      changedOccupancy.estimatedChildOccupancyRate = attributes.estimatedChildOccupancyRate
    }
    if (
      attributes.actualChildOccupancyRate !== undefined &&
      !new Big(childCareSpace.actualChildOccupancyRate).eq(attributes.actualChildOccupancyRate)
    ) {
      changedOccupancy.actualChildOccupancyRate = attributes.actualChildOccupancyRate
    }

    return changedOccupancy
  }

  private async updateLinkedOccupancy(
    childCareSpace: ChildCareSpace,
    occupancy: Partial<ChildCareSpaceUpdateAttributes>,
    transaction: Transaction
  ): Promise<void> {
    const { centreId, fiscalPeriodId, categoryId } = childCareSpace
    const where = { centreId, fiscalPeriodId, childCareSpaceCategoryId: categoryId }

    await AdministrationCost.findEach({ where, transaction }, async (administrationCost) => {
      await administrationCost.update(occupancy, { transaction })
    })
    await QualityEnhancement.findEach({ where, transaction }, async (qualityEnhancement) => {
      await qualityEnhancement.update(occupancy, { transaction })
    })
  }
}

export default UpdateService
