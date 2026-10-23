import { Factory } from "fishery"

import { FiscalPeriodMonths, type FiscalPeriod } from "@/api/fiscal-periods-api"

export const fiscalPeriodFactory = Factory.define<FiscalPeriod>(({ sequence }) => {
  const timestamp = "2026-01-01T00:00:00.000Z"

  return {
    id: sequence,
    fundingPeriodId: sequence,
    fiscalYear: "2024-25",
    month: FiscalPeriodMonths.APRIL,
    dateStart: "2024-04-01",
    dateEnd: "2024-04-30",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
})

export default fiscalPeriodFactory
