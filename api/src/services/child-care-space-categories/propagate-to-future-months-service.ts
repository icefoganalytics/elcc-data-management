import Big from "big.js"
import { Op, sql, type Transaction } from "@sequelize/core"
import { isNil } from "lodash"

import { ChildCareSpace, ChildCareSpaceCategory, Centre, FiscalPeriod } from "@/models"
import BaseService from "@/services/base-service"

export type ChildCareSpaceCategoryPropagationOptions = {
  applyToFutureMonths?: boolean
  propagationStartFiscalPeriodId?: number | null
}

type ChildCareSpaceCategorySnapshot = Pick<ChildCareSpaceCategory, "categoryName" | "monthlyAmount">

type PropagationAction =
  | { action: "create" }
  | { action: "update"; previousCategorySnapshot: ChildCareSpaceCategorySnapshot }

export class PropagateToFutureMonthsService extends BaseService {
  constructor(
    private category: ChildCareSpaceCategory,
    private propagationStartFiscalPeriodId: number | null | undefined,
    private transaction: Transaction,
    private propagationAction: PropagationAction
  ) {
    super()
  }

  async perform(): Promise<void> {
    if (
      typeof this.propagationStartFiscalPeriodId !== "number" ||
      !Number.isSafeInteger(this.propagationStartFiscalPeriodId) ||
      this.propagationStartFiscalPeriodId < 0
    ) {
      throw new Error("Propagation start fiscal period ID must be a non-negative integer")
    }

    const startFiscalPeriod = await FiscalPeriod.findOne({
      attributes: ["id", "dateStart"],
      where: {
        id: this.propagationStartFiscalPeriodId,
        fundingPeriodId: this.category.fundingPeriodId,
      },
      transaction: this.transaction,
    })
    if (isNil(startFiscalPeriod)) {
      throw new Error(
        "Propagation start fiscal period was not found in the category funding period"
      )
    }

    const fiscalPeriodIds: number[] = []
    await FiscalPeriod.findEach(
      {
        attributes: ["id"],
        where: {
          fundingPeriodId: this.category.fundingPeriodId,
          dateStart: { [Op.gte]: startFiscalPeriod.dateStart },
        },
        transaction: this.transaction,
      },
      async (fiscalPeriod) => {
        fiscalPeriodIds.push(fiscalPeriod.id)
      }
    )

    if (this.propagationAction.action === "create") {
      await this.createMissingSpaces(fiscalPeriodIds)
      return
    }

    await this.updateEligibleSpaces(
      fiscalPeriodIds,
      this.propagationAction.previousCategorySnapshot
    )
    await this.createMissingSpaces(fiscalPeriodIds)
  }

  private async createMissingSpaces(fiscalPeriodIds: number[]): Promise<void> {
    const existingPairKeys = new Set<string>()
    await ChildCareSpace.findEach(
      {
        attributes: ["centreId", "fiscalPeriodId"],
        where: {
          categoryId: this.category.id,
          fiscalPeriodId: { [Op.in]: fiscalPeriodIds },
        },
        paranoid: false,
        transaction: this.transaction,
      },
      async (childCareSpace) => {
        existingPairKeys.add(`${childCareSpace.centreId}:${childCareSpace.fiscalPeriodId}`)
      }
    )

    await Centre.findEach({ attributes: ["id"], transaction: this.transaction }, async (centre) => {
      for (const fiscalPeriodId of fiscalPeriodIds) {
        const pairKey = `${centre.id}:${fiscalPeriodId}`
        if (existingPairKeys.has(pairKey)) {
          continue
        }

        await ChildCareSpace.create(
          {
            centreId: centre.id,
            fiscalPeriodId,
            categoryId: this.category.id,
            lineName: this.category.categoryName,
            monthlyAmount: this.category.monthlyAmount,
            estimatedChildOccupancyRate: "0.0000",
            actualChildOccupancyRate: "0.0000",
            estimatedComputedTotal: "0.0000",
            actualComputedTotal: "0.0000",
          },
          { transaction: this.transaction }
        )
        existingPairKeys.add(pairKey)
      }
    })
  }

  private async updateEligibleSpaces(
    fiscalPeriodIds: number[],
    previousCategorySnapshot: ChildCareSpaceCategorySnapshot
  ): Promise<void> {
    const nonDeletedCentreIds = sql`
      (
        SELECT
          id
        FROM
          centres
        WHERE
          deleted_at IS NULL
      )
    `

    await ChildCareSpace.findEach(
      {
        where: {
          categoryId: this.category.id,
          fiscalPeriodId: { [Op.in]: fiscalPeriodIds },
          centreId: { [Op.in]: nonDeletedCentreIds },
        },
        transaction: this.transaction,
      },
      async (childCareSpace) => {
        const hasActualOccupancy = !new Big(childCareSpace.actualChildOccupancyRate).eq(0)
        const hasManualSnapshot =
          childCareSpace.lineName !== previousCategorySnapshot.categoryName ||
          !new Big(childCareSpace.monthlyAmount).eq(previousCategorySnapshot.monthlyAmount)
        if (hasActualOccupancy || hasManualSnapshot) {
          return
        }

        await childCareSpace.update(
          {
            lineName: this.category.categoryName,
            monthlyAmount: this.category.monthlyAmount,
          },
          { transaction: this.transaction }
        )
      }
    )
  }
}

export default PropagateToFutureMonthsService
