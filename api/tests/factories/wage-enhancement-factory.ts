import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { WageEnhancement } from "@/models"

import centreFactory from "@/factories/centre-factory"
import employeeWageTierFactory from "@/factories/employee-wage-tier-factory"

export const wageEnhancementFactory = FactoryShark.define<WageEnhancement>(
  WageEnhancement,
  ({ associate }) => {
    associate("centre", centreFactory)
    associate("employeeWageTier", employeeWageTierFactory)

    return {
      employeeName: faker.person.fullName(),
      hoursEstimated: faker.finance.amount({ min: 0, max: 100 }),
      hoursActual: faker.finance.amount({ min: 0, max: 100 }),
    }
  }
)

export default wageEnhancementFactory
