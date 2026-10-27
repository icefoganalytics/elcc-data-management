import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { EmployeeWageTier } from "@/models"

import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const TIER_LABEL_EXAMPLES = Object.freeze([
  {
    tierLabel: "Level 0",
    wageRatePerHour: "0.0",
  },
  {
    tierLabel: "Level 1",
    wageRatePerHour: "4.12",
  },
  {
    tierLabel: "Level 1a",
    wageRatePerHour: "6.01",
  },
  {
    tierLabel: "Level 2",
    wageRatePerHour: "7.44",
  },
  {
    tierLabel: "Level 2a",
    wageRatePerHour: "9.96",
  },
  {
    tierLabel: "Level 3 Exemption",
    wageRatePerHour: "12.31",
  },
  {
    tierLabel: "ECE Level 3",
    wageRatePerHour: "15.31",
  },
])

export const employeeWageTierFactory = FactoryShark.define<EmployeeWageTier>(
  EmployeeWageTier,
  ({ associate }) => {
    associate("fiscalPeriod", fiscalPeriodFactory)

    const tierLevel = faker.number.int({ min: 0, max: TIER_LABEL_EXAMPLES.length - 1 })
    const { tierLabel, wageRatePerHour } = TIER_LABEL_EXAMPLES[tierLevel]

    return {
      tierLevel,
      tierLabel,
      wageRatePerHour,
    }
  }
)

export default employeeWageTierFactory
