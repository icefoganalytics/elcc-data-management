import { Op } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildrenWithDiverseNeedsFundingCategory, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"

const DEFAULT_CATEGORIES = [
  { categoryName: "Toddlers", fromAge: 2, toAge: 3, monthlyAmount: "54.96" },
  { categoryName: "Preschool", fromAge: 4, toAge: 5, monthlyAmount: "91.6" },
  { categoryName: "Kindergarten", fromAge: 5, toAge: 6, monthlyAmount: "91.6" },
  { categoryName: "School Age", fromAge: 5, toAge: 6, monthlyAmount: "114.5" },
]

export class BulkCreateService extends BaseService {
  constructor(private fundingPeriod: FundingPeriod) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingCategory[]> {
    const previousFundingPeriod = await FundingPeriod.findOne({
      attributes: ["id"],
      where: {
        fiscalYear: { [Op.lt]: this.fundingPeriod.fiscalYear },
      },
      order: [
        ["fiscalYear", "DESC"],
        ["fromDate", "DESC"],
        ["id", "DESC"],
      ],
    })
    const previousCategories = isNil(previousFundingPeriod)
      ? []
      : await ChildrenWithDiverseNeedsFundingCategory.findAll({
          where: { fundingPeriodId: previousFundingPeriod.id },
          order: [["id", "ASC"]],
        })

    const categories = isNil(previousFundingPeriod)
      ? DEFAULT_CATEGORIES
      : previousCategories.map(({ categoryName, fromAge, toAge, monthlyAmount }) => ({
          categoryName,
          fromAge,
          toAge,
          monthlyAmount,
        }))

    return ChildrenWithDiverseNeedsFundingCategory.bulkCreate(
      categories.map((category) => ({ ...category, fundingPeriodId: this.fundingPeriod.id }))
    )
  }
}

export default BulkCreateService
