import { type CreationAttributes } from "@sequelize/core"
import { isNil, isUndefined } from "lodash"

import db, { ChildCareSpaceCategory } from "@/models"
import BaseService from "@/services/base-service"

import PropagateToFutureMonthsService, {
  type ChildCareSpaceCategoryPropagationOptions,
} from "@/services/child-care-space-categories/propagate-to-future-months-service"

export type ChildCareSpaceCategoryCreationAttributes = Partial<
  CreationAttributes<ChildCareSpaceCategory>
> &
  ChildCareSpaceCategoryPropagationOptions

export class CreateService extends BaseService {
  constructor(private attributes: ChildCareSpaceCategoryCreationAttributes) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory> {
    const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = this.attributes
    if (isNil(fundingPeriodId)) {
      throw new Error("Funding period ID is required")
    }

    if (isNil(categoryName)) {
      throw new Error("Category name is required")
    }

    if (isNil(monthlyAmount)) {
      throw new Error("Monthly amount is required")
    }

    const { applyToFutureMonths, propagationStartFiscalPeriodId } = this.attributes
    if (!isUndefined(applyToFutureMonths) && typeof applyToFutureMonths !== "boolean") {
      throw new Error("applyToFutureMonths must be a boolean")
    }

    return db.transaction(async (transaction) => {
      const category = await ChildCareSpaceCategory.create(
        {
          fundingPeriodId,
          categoryName,
          fromAge: fromAge ?? null,
          toAge: toAge ?? null,
          monthlyAmount,
        },
        { transaction }
      )

      if (applyToFutureMonths === true) {
        await PropagateToFutureMonthsService.perform(
          category,
          propagationStartFiscalPeriodId,
          transaction,
          { action: "create" }
        )
      }

      return category
    })
  }
}

export default CreateService
