import FactoryShark from "factory-shark"
import { DateTime } from "luxon"

import { FundingPeriod } from "@/models"

export const fundingPeriodFactory = FactoryShark.define<FundingPeriod>(
  FundingPeriod,
  ({ params, sequence }) => {
    let currentYear = DateTime.now().year
    if (params.fiscalYear) {
      currentYear = parseInt(params.fiscalYear.split("-")[0])
    }

    const nextYear = currentYear + 1
    const fiscalYear = [currentYear, nextYear].join("-")
    const fromDate = DateTime.fromObject({
      year: currentYear,
      month: 4,
      day: 1,
    }).toJSDate()
    const toDate = DateTime.fromObject({
      year: nextYear,
      month: 3,
    })
      .endOf("month")
      .set({ millisecond: 0 })
      .toJSDate()
    const title = `Funding Period ${sequence}`

    return {
      fiscalYear,
      fromDate,
      toDate,
      title,
    }
  }
)

export default fundingPeriodFactory
