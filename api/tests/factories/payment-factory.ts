import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { Payment } from "@/models"

import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const paymentFactory = FactoryShark.define<Payment>(
  Payment,
  ({ associate, params, sequence }) => {
    associate("centre", centreFactory)

    let currentYear = new Date().getFullYear()
    if (params.fiscalYear) {
      currentYear = parseInt(params.fiscalYear.split("/")[0])
    } else if (params.fiscalPeriod) {
      currentYear = parseInt(params.fiscalPeriod.fiscalYear.split("-")[0])
    }

    const nextYear = currentYear + 1
    const nextYearSuffix = nextYear.toString().slice(-2)
    const fiscalYearShort = [currentYear, nextYearSuffix].join("-")
    const fiscalYearLegacy = [currentYear, nextYearSuffix].join("/")

    const fiscalPeriod = associate("fiscalPeriod", fiscalPeriodFactory, {
      fiscalYear: fiscalYearShort,
    })
    const periodDefaults = params.fiscalPeriod ?? fiscalPeriod

    const { dateStart: fiscalPeriodStart, dateEnd: fiscalPeriodEnd } = periodDefaults
    const paidOn = faker.date
      .between({
        from: fiscalPeriodStart,
        to: fiscalPeriodEnd,
      })
      .toISOString()
      .split("T")[0]

    return {
      fiscalYear: fiscalYearLegacy,
      paidOn,
      name: `Payment ${sequence}`,
      amount: faker.finance.amount({ min: 10, max: 1000, dec: 2 }),
    }
  }
)

export default paymentFactory
