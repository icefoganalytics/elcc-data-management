import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { EmployeeBenefit } from "@/models"

import centreFactory from "@/factories/centre-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const employeeBenefitFactory = FactoryShark.define<EmployeeBenefit>(
  EmployeeBenefit,
  ({ associate }) => {
    associate("centre", centreFactory)
    associate("fiscalPeriod", fiscalPeriodFactory)

    return {
      grossPayrollMonthlyActual: faker.finance.amount({ min: 1000, max: 50000 }),
      grossPayrollMonthlyEstimated: faker.finance.amount({ min: 1000, max: 50000 }),
      costCapPercentage: faker.finance.amount({ min: 0.01, max: 0.5 }),
      employeeCostActual: faker.finance.amount({ min: 100, max: 10000 }),
      employeeCostEstimated: faker.finance.amount({ min: 100, max: 10000 }),
      employerCostActual: faker.finance.amount({ min: 100, max: 10000 }),
      employerCostEstimated: faker.finance.amount({ min: 100, max: 10000 }),
    }
  }
)

export default employeeBenefitFactory
