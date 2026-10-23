import { Factory } from "fishery"

import { type EmployeeWageTierAsShow } from "@/api/employee-wage-tiers-api"

export const employeeWageTierFactory = Factory.define<EmployeeWageTierAsShow>(({ sequence }) => {
  const timestamp = "2026-01-01T00:00:00.000Z"

  return {
    id: sequence,
    fiscalPeriodId: sequence,
    tierLevel: 1,
    tierLabel: "Tier 1",
    wageRatePerHour: "20.0000",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
})

export default employeeWageTierFactory
