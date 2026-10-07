import Big from "big.js"
import { QueryTypes } from "@sequelize/core"

import db from "@/models"
import BaseService from "@/services/base-service"

export class CalculateFundingReceivedPeriodAmountService extends BaseService {
  constructor(
    private centreId: number,
    private fiscalPeriodId: number
  ) {
    super()
  }

  async perform(): Promise<string> {
    const [paymentTotals] = await db.query<{
      paymentsTotalAmount: string
    }>(
      /* sql */ `
        SELECT
          CONVERT(VARCHAR(50), COALESCE(SUM(amount), 0)) AS paymentsTotalAmount
        FROM
          payments
        WHERE
          centre_id = :centreId
          AND fiscal_period_id = :fiscalPeriodId
          AND deleted_at IS NULL
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          centreId: this.centreId,
          fiscalPeriodId: this.fiscalPeriodId,
        },
      }
    )
    const { paymentsTotalAmount } = paymentTotals

    return Big(paymentsTotalAmount).toFixed(4)
  }
}

export default CalculateFundingReceivedPeriodAmountService
