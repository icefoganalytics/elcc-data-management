import { Factory } from "fishery"

import { type WageEnhancementAsShow } from "@/api/wage-enhancements-api"

import employeeWageTierFactory from "@/tests/factories/employee-wage-tier-factory"

export const wageEnhancementFactory = Factory.define<WageEnhancementAsShow>(
  ({ sequence, params, associations }) => {
    const timestamp = "2026-01-01T00:00:00.000Z"
    const employeeWageTier =
      associations.employeeWageTier ??
      employeeWageTierFactory.build({ id: params.employeeWageTierId })

    return {
      id: sequence,
      centreId: sequence,
      employeeWageTierId: employeeWageTier.id,
      employeeName: `Employee ${sequence}`,
      hoursEstimated: "0.0000",
      hoursActual: "0.0000",
      employeeWageTier,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }
)

export default wageEnhancementFactory
