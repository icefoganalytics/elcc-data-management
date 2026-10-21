import { Op, sql } from "@sequelize/core"
import { isNil } from "lodash"

import ChildCareSpaceCategory from "@/models/child-care-space-category"
import FundingPeriod from "@/models/funding-period"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BaseService from "@/services/base-service"

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<QualityEnhancementCategory[]> {
    const previousFundingPeriod = await FundingPeriod.findOne({
      attributes: ["id"],
      where: {
        id: {
          [Op.in]: sql`(SELECT funding_period_id FROM quality_enhancement_categories)`,
        },
      },
      order: [
        ["fiscalYear", "DESC"],
        ["fromDate", "DESC"],
        ["id", "DESC"],
      ],
    })
    const previousCategories = isNil(previousFundingPeriod)
      ? []
      : await QualityEnhancementCategory.findAll({
          where: { fundingPeriodId: previousFundingPeriod.id },
          include: [
            {
              association: "childCareSpaceCategory",
              attributes: ["categoryName"],
              paranoid: false,
            },
          ],
          order: [["id", "ASC"]],
        })
    const spaceCategories = await ChildCareSpaceCategory.findAll({
      where: { fundingPeriodId: this.fundingPeriod.id },
      attributes: ["id", "categoryName"],
    })
    const spaceCategoryIdsByName = new Map(
      spaceCategories.map(({ id, categoryName }) => [categoryName, id])
    )
    const attributes = isNil(previousFundingPeriod)
      ? QualityEnhancementCategory.DEFAULTS.map((category) => ({
          fundingPeriodId: this.fundingPeriod.id,
          categoryName: category.categoryName,
          fromAge: category.fromAge,
          toAge: category.toAge,
          monthlyAmount: category.monthlyAmount,
          childCareSpaceCategoryId: spaceCategoryIdsByName.get(category.categoryName) ?? null,
        }))
      : previousCategories.map((category) => ({
          fundingPeriodId: this.fundingPeriod.id,
          categoryName: category.categoryName,
          fromAge: category.fromAge,
          toAge: category.toAge,
          monthlyAmount: category.monthlyAmount,
          childCareSpaceCategoryId: category.childCareSpaceCategory
            ? (spaceCategoryIdsByName.get(category.childCareSpaceCategory.categoryName) ?? null)
            : null,
        }))
    return QualityEnhancementCategory.bulkCreate(attributes)
  }
}

export default BulkCreateService
