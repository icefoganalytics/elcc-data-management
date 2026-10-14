import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("centres", (table) => {
    table
      .boolean("hot_meal")
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .boolean("is_first_nation_program")
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("building_usage_percent", 5, 2)
      .notNullable()
      .defaultTo(knex.raw("100"))
      .alter({ alterType: false, alterNullable: false })
  })
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("Centre default normalization is irreversible; canonical defaults are retained.")
}
