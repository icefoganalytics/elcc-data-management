import { IsolationLevel, TableHints, type Attributes } from "@sequelize/core"
import { isUndefined } from "lodash"

import db, { ChildCareSpaceCategory } from "@/models"
import BaseService from "@/services/base-service"

import PropagateToFutureMonthsService, {
  type ChildCareSpaceCategoryPropagationOptions,
} from "@/services/child-care-space-categories/propagate-to-future-months-service"

export type ChildCareSpaceCategoryUpdateAttributes = Partial<
  Pick<Attributes<ChildCareSpaceCategory>, "monthlyAmount">
> &
  ChildCareSpaceCategoryPropagationOptions

export class UpdateService extends BaseService {
  constructor(
    private category: ChildCareSpaceCategory,
    private attributes: ChildCareSpaceCategoryUpdateAttributes
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpaceCategory> {
    const { applyToFutureMonths, propagationStartFiscalPeriodId, monthlyAmount } = this.attributes
    if (!isUndefined(applyToFutureMonths) && typeof applyToFutureMonths !== "boolean") {
      throw new Error("applyToFutureMonths must be a boolean")
    }

    // Keep occupancy data locked while snapshot updates recompute their totals.
    return db.transaction(
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
      async (transaction) => {
        await this.category.reload({
          transaction,
          tableHints: [TableHints.UPDLOCK],
          include: ["childCareCategory"],
        })
        const previousCategorySnapshot = {
          categoryName: this.category.categoryName,
          monthlyAmount: this.category.monthlyAmount,
        }

        await this.category.update({ monthlyAmount }, { transaction })

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
