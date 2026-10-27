import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"
import { DateTime } from "luxon"

import { FundingSubmissionLineJson } from "@/models"
import { FundingSubmissionLineJsonMonths } from "@/models/funding-submission-line-json"
import { formatAsFiscalYear } from "@/factories/helpers"
import centreFactory from "@/factories/centre-factory"

export const fundingSubmissionLineJsonFactory = FactoryShark.define<FundingSubmissionLineJson>(
  FundingSubmissionLineJson,
  ({ associate }) => {
    associate("centre", centreFactory)

    const year = faker.number.int({ min: 2022, max: 2027 })
    const month = faker.number.int({ min: 1, max: 12 })
    const dateStart = DateTime.local(year, month, 1).startOf("month")
    const dateEnd = dateStart.endOf("month")
    const dateName = dateStart.toFormat("MMMM")

    const APRIL = 4 // Luxon uses 1-indexed months
    const fiscalYearStartYear = month >= APRIL ? year : year - 1
    const fiscalYear = formatAsFiscalYear(fiscalYearStartYear)

    return {
      fiscalYear,
      dateName: dateName as FundingSubmissionLineJsonMonths,
      dateStart: dateStart.toJSDate(),
      dateEnd: dateEnd.toJSDate(),
      values: JSON.stringify([]),
    }
  }
)

export default fundingSubmissionLineJsonFactory
