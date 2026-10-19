import { IsolationLevel, type Attributes } from "@sequelize/core"
import { isUndefined } from "lodash"

import db, { ChildCareSpaceCategory } from "@/models"
import BaseService from "@/services/base-service"

import PropagateToFutureMonthsService, {
  type ChildCareSpaceCategoryPropagationOptions,
} from "@/services/child-care-space-categories/propagate-to-future-months-service"

export type ChildCareSpaceCategoryUpdateAttributes = Partial<Attributes<ChildCareSpaceCategory>> &
  ChildCareSpaceCategoryPropagationOptions

export class UpdateService extends BaseService {
  constructor(
    private category: ChildCareSpaceCategory,
    private attributes: ChildCareSpaceCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory> {
    const {
      fundingPeriodId: _ignoredFundingPeriodId,
      applyToFutureMonths,
      propagationStartFiscalPeriodId,
      ...attributes
    } = this.attributes
    if (!isUndefined(applyToFutureMonths) && typeof applyToFutureMonths !== "boolean") {
      throw new Error("applyToFutureMonths must be a boolean")
    }

    const previousCategorySnapshot = {
      categoryName: this.category.categoryName,
      monthlyAmount: this.category.monthlyAmount,
    }
    // Keep occupancy data locked while snapshot updates recompute their totals.
    return db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        await this.category.update(attributes, { transaction })

        if (applyToFutureMonths === true) {
          await PropagateToFutureMonthsService.perform(
            this.category,
            propagationStartFiscalPeriodId,
            transaction,
            { action: "update", previousCategorySnapshot }
          )
        }

        return this.category
      }
    )
  }
}

export default UpdateService
