import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("employee_benefits", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable().references("id").inTable("centres")
    table.integer("fiscal_period_id").notNullable().references("id").inTable("fiscal_periods")
    table.string("employee_name", 100).notNullable()
    table.decimal("estimated_cost_cpp", 10, 2)
    table.decimal("estimated_cost_ei", 10, 2)
    table.decimal("estimated_cost_wch", 10, 2)
    table.decimal("estimated_cost_vacation_pay", 10, 2)
    table.decimal("estimated_cost_health_care", 10, 2)
    table.decimal("estimated_cost_other", 10, 2)
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
    "CREATE UNIQUE INDEX idx_employee_benefits_centre_period_name_unique ON employee_benefits (centre_id, fiscal_period_id, employee_name) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("employee_benefits")
}
