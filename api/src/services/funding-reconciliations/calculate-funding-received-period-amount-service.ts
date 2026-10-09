import Big from "big.js"
import { sql } from "@sequelize/core"

import { Payment } from "@/models"
import BaseService from "@/services/base-service"

export class CalculateFundingReceivedPeriodAmountService extends BaseService {
  constructor(
    private centreId: number,
    private fiscalPeriodId: number
  ) {
    super()
  }

  async perform(): Promise<string> {
    const [paymentTotals] = await Payment.findAll<Payment, { paymentsTotalAmount: string }>({
      attributes: [
        [
          sql.cast(sql.fn("COALESCE", sql.fn("SUM", sql.attribute("amount")), 0), "VARCHAR(50)"),
          "paymentsTotalAmount",
        ],
      ],
      where: {
        centreId: this.centreId,
        fiscalPeriodId: this.fiscalPeriodId,
      },
      raw: true,
    })
    const { paymentsTotalAmount } = paymentTotals

    return Big(paymentsTotalAmount).toFixed(4)
  }
}

export default CalculateFundingReceivedPeriodAmountService
