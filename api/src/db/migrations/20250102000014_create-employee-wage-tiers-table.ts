import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("employee_wage_tiers", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("fiscal_period_id").notNullable().references("id").inTable("fiscal_periods")
    table.integer("tier_level").notNullable()
    table.decimal("wage", 10, 2).notNullable()
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
    "CREATE UNIQUE INDEX idx_employee_wage_tiers_period_tier_unique ON employee_wage_tiers (fiscal_period_id, tier_level) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("employee_wage_tiers")
}
