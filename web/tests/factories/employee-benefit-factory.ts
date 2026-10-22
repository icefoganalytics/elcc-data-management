import { Factory } from "fishery"

import { type EmployeeBenefitAsShow } from "@/api/employee-benefits-api"

export const employeeBenefitFactory = Factory.define<EmployeeBenefitAsShow>(({ sequence }) => {
  const timestamp = "2026-01-01T00:00:00.000Z"

  return {
    id: sequence,
    centreId: sequence,
    fiscalPeriodId: sequence,
    grossPayrollMonthlyActual: "0.0000",
    grossPayrollMonthlyEstimated: "0.0000",
    costCapPercentage: "0.1000",
    employeeCostActual: "0.0000",
    employeeCostEstimated: "0.0000",
    employerCostActual: "0.0000",
    employerCostEstimated: "0.0000",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
})

export default employeeBenefitFactory
