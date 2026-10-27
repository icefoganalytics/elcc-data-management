import FactoryShark from "factory-shark"
import { DateTime } from "luxon"

import { FiscalPeriod } from "@/models"

import fundingPeriodFactory from "@/factories/funding-period-factory"

export const fiscalPeriodFactory = FactoryShark.define<FiscalPeriod>(
  FiscalPeriod,
  ({ associate, params, beforeCreate }) => {
    const fiscalYear = params.fiscalYear ?? params.fundingPeriod?.fiscalYear
    const currentYear = fiscalYear ? parseInt(fiscalYear.split("-")[0]) : new Date().getFullYear()
    const nextYear = currentYear + 1
    const fiscalYearLong = [currentYear, nextYear].join("-")
    const fundingPeriod = associate("fundingPeriod", fundingPeriodFactory, {
      fiscalYear: fiscalYearLong,
    })
    const dateStart = params.dateStart ?? params.fundingPeriod?.fromDate ?? fundingPeriod.fromDate
    const dateStartDateTime = DateTime.fromJSDate(dateStart)
    const dateEnd = dateStartDateTime.endOf("month").set({ millisecond: 0 }).toJSDate()
    const fiscalYearShort = FiscalPeriod.toShortFiscalYearFormat(fiscalYearLong)
    const month = FiscalPeriod.asFiscalPeriodMonth(dateStartDateTime)

    // Foreign-key overrides are loaded after generation; derive defaults from the resolved parent.
    beforeCreate(async (fiscalPeriod) => {
      const resolvedFundingPeriod = fiscalPeriod.fundingPeriod
      if (resolvedFundingPeriod === undefined) return

      if (params.fiscalYear === undefined) {
        fiscalPeriod.fiscalYear = FiscalPeriod.toShortFiscalYearFormat(
          resolvedFundingPeriod.fiscalYear
        )
      }

      if (params.dateStart === undefined) {
        fiscalPeriod.dateStart = resolvedFundingPeriod.fromDate
      }

      const resolvedDateStart = DateTime.fromJSDate(fiscalPeriod.dateStart)
      if (params.dateEnd === undefined) {
        fiscalPeriod.dateEnd = resolvedDateStart.endOf("month").set({ millisecond: 0 }).toJSDate()
      }

      if (params.month === undefined) {
        fiscalPeriod.month = FiscalPeriod.asFiscalPeriodMonth(resolvedDateStart)
      }
    })

    return {
      fiscalYear: fiscalYearShort,
      month,
      dateStart,
      dateEnd,
    }
  }
)

export default fiscalPeriodFactory
