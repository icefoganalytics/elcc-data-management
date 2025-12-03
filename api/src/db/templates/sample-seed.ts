import type { Knex } from "knex"
import * as models from "@/models"

export async function seed(knex: Knex): Promise<void> {
  throw new Error("Not implemented")

  // Seeds use Sequelize Models for type safety and consistency with application code
  // Example: Using Model.findOrCreate for idempotent seeding
  await models.Centre.findOrCreate({
    where: {
      name: "Example Centre",
    },
    defaults: {
      name: "Example Centre",
      license: "123",
      community: "Whitehorse",
      region: "WHITEHORSE",
      status: "Active",
      hotMeal: true,
      licensedFor: 20,
    },
  })

  // Alternative: Bulk create with ignoreDuplicates
  await models.Centre.bulkCreate(
    [
      {
        name: "Example Centre 1",
        license: "456",
        community: "Whitehorse",
        region: "WHITEHORSE",
        status: "Active",
      },
      {
        name: "Example Centre 2",
        license: "789",
        community: "Dawson",
        region: "DAWSON",
        status: "Active",
      },
    ],
    { ignoreDuplicates: true }
  )
}
