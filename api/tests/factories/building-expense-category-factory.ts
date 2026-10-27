import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { BuildingExpenseCategory } from "@/models"

import fundingRegionFactory from "@/factories/funding-region-factory"

export const buildingExpenseCategoryFactory = FactoryShark.define<BuildingExpenseCategory>(
  BuildingExpenseCategory,
  ({ sequence, associate }) => {
    associate("fundingRegion", fundingRegionFactory)

    const categoryName =
      faker.helpers.arrayElement([
        "Rent or Mortgage",
        "Phone",
        "Internet",
        "Cell Phone",
        "Security",
        "Electric",
        "Fuel",
        "Garbage",
        "Snow Removal",
        "Water/Sewer/Taxes",
        "Insurance",
        "Janitorial",
        "Cleaning Supplies",
        "Minor Repairs",
      ]) + `-${sequence}`

    const subsidyRate = faker.finance.amount({ min: 0.01, max: 0.5, dec: 4 })

    return {
      categoryName,
      subsidyRate,
    }
  }
)

export default buildingExpenseCategoryFactory
