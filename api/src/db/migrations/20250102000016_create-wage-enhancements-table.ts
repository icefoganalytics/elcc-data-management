import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wage_enhancements", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable().references("id").inTable("centres")
    table
      .integer("employee_wage_tier_id")
      .notNullable()
      .references("id")
      .inTable("employee_wage_tiers")
    table.string("employee_name", 100).notNullable()
    table.decimal("hours", 10, 2)
    table.integer("weeks")
    table.string("enhancement_type", 100)
    table.boolean("is_certificated")
    table
      .specificType("created_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table
      .specificType("updated_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })

  await knex.raw(
    "CREATE UNIQUE INDEX idx_wage_enhancements_centre_tier_name_unique ON wage_enhancements (centre_id, employee_wage_tier_id, employee_name) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("wage_enhancements")
}
