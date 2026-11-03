import { Op, type CreationAttributes } from "@sequelize/core"
import { isNil } from "lodash"

import db, { AdministrationCost, AdministrationCostCategory, Centre, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export type AdministrationCostCreationAttributes = Partial<
  Pick<
    CreationAttributes<AdministrationCost>,
    | "centreId"
    | "fiscalPeriodId"
    | "categoryId"
    | "estimatedChildOccupancyRate"
    | "actualChildOccupancyRate"
  >
> & {
  applyToCurrentAndFutureFiscalPeriods?: boolean
}

export class CreateService extends BaseService {
  constructor(private attributes: AdministrationCostCreationAttributes) {
    super()
  }

  async perform(): Promise<AdministrationCost> {
    const {
      centreId,
      fiscalPeriodId,
      categoryId,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      applyToCurrentAndFutureFiscalPeriods,
    } = this.attributes
    if (isNil(centreId)) throw new Error("Centre ID is required")
    if (isNil(fiscalPeriodId)) throw new Error("Fiscal period ID is required")
    if (isNil(categoryId)) throw new Error("Administration cost category ID is required")
    if (isNil(estimatedChildOccupancyRate)) {
      throw new Error("Estimated child occupancy rate is required")
    }
    if (isNil(actualChildOccupancyRate)) {
      throw new Error("Actual child occupancy rate is required")
    }

    return db.transaction(async () => {
      const centre = await Centre.findByPk(centreId, { attributes: ["id"] })
      if (isNil(centre)) throw new Error("Centre not found")

      const fiscalPeriod = await FiscalPeriod.findByPk(fiscalPeriodId)
      if (isNil(fiscalPeriod)) throw new Error("Fiscal period not found")

      const category = await AdministrationCostCategory.findOne({
        where: { id: categoryId, fundingPeriodId: fiscalPeriod.fundingPeriodId },
      })
      if (isNil(category)) {
        throw new Error("Administration cost category must be active in the same funding period")
      }

      const administrationCost = await AdministrationCost.create({
        centreId,
        fiscalPeriodId,
        categoryId,
        childCareSpaceCategoryId: category.childCareSpaceCategoryId,
        lineName: category.categoryName,
        monthlyAmount: category.monthlyAmount,
        estimatedChildOccupancyRate,
        actualChildOccupancyRate,
        estimatedComputedTotal: "0.0000",
        actualComputedTotal: "0.0000",
      })
      if (!applyToCurrentAndFutureFiscalPeriods) return administrationCost

      await FiscalPeriod.findEach(
        {
          attributes: ["id"],
          where: {
            fundingPeriodId: fiscalPeriod.fundingPeriodId,
            dateStart: { [Op.gt]: fiscalPeriod.dateStart },
          },
          order: [["dateStart", "ASC"]],
        },
        async (futureFiscalPeriod) => {
          const existingCost = await AdministrationCost.findOne({
            attributes: ["id"],
            where: { centreId, categoryId, fiscalPeriodId: futureFiscalPeriod.id },
          })
          if (!isNil(existingCost)) return

          await AdministrationCost.create({
            centreId,
            fiscalPeriodId: futureFiscalPeriod.id,
            categoryId,
            childCareSpaceCategoryId: category.childCareSpaceCategoryId,
            lineName: category.categoryName,
            monthlyAmount: category.monthlyAmount,
            estimatedChildOccupancyRate,
            actualChildOccupancyRate,
            estimatedComputedTotal: "0.0000",
            actualComputedTotal: "0.0000",
          })
        }
      )

      return administrationCost
    })
  }
}

export default CreateService
