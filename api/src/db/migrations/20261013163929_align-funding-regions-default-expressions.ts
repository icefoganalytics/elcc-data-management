import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_regions", (table) => {
    table
      .decimal("hot_meal_increment_amount", 10, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
  })
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Funding region default normalization is irreversible; canonical defaults are retained."
  )
}
