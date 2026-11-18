import { type CreationAttributes } from "@sequelize/core"
import { isEmpty } from "lodash"

import {
  AdministrationCost,
  AdministrationCostCategory,
  Centre,
  FiscalPeriod,
  FundingPeriod,
} from "@/models"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<AdministrationCost[]> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: {
        fundingPeriodId: this.fundingPeriod.id,
      },
      order: [["dateStart", "ASC"]],
    })
    if (isEmpty(fiscalPeriods)) {
      throw new Error("No fiscal periods found for the given funding period.")
    }

    const categories = await AdministrationCostCategory.findAll({
      attributes: ["id", "childCareCategoryId", "monthlyAmount"],
      where: {
        fundingPeriodId: this.fundingPeriod.id,
      },
      order: [["id", "ASC"]],
    })
    if (isEmpty(categories)) {
      return []
    }

    const spaceCategories = await ChildCareSpaceCategory.findAll({
      attributes: ["id", "childCareCategoryId"],
      where: { fundingPeriodId: this.fundingPeriod.id },
    })
    const spaceCategoryIdsBySharedCategoryId = new Map(
      spaceCategories.map(({ id, childCareCategoryId }) => [childCareCategoryId, id])
    )

    const administrationCostsAttributes: CreationAttributes<AdministrationCost>[] = []
    for (const fiscalPeriod of fiscalPeriods) {
      for (const category of categories) {
        administrationCostsAttributes.push({
          centreId: this.centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: category.id,
          childCareSpaceCategoryId:
            spaceCategoryIdsBySharedCategoryId.get(category.childCareCategoryId) ?? null,
          lineName: category.categoryName,
          monthlyAmount: category.monthlyAmount,
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
          estimatedComputedTotal: "0.0000",
          actualComputedTotal: "0.0000",
        })
      }
    }

    return AdministrationCost.bulkCreate(administrationCostsAttributes)
  }
}

export default BulkCreateService
