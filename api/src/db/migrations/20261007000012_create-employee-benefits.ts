import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("employee_benefits")) return

  await knex.schema.createTable("employee_benefits", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.integer("fiscal_period_id").notNullable()
    table.decimal("gross_payroll_monthly_actual", 15, 4).notNullable()
    table.decimal("gross_payroll_monthly_estimated", 15, 4).notNullable()
    table.decimal("cost_cap_percentage", 5, 2).notNullable()
    table.decimal("employee_cost_actual", 15, 4).notNullable()
    table.decimal("employee_cost_estimated", 15, 4).notNullable()
    table.decimal("employer_cost_actual", 15, 4).notNullable()
    table.decimal("employer_cost_estimated", 15, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table.foreign("centre_id", "FK__employee___centr__24285DB4").references("centres.id")

    table
      .foreign("fiscal_period_id", "employee_benefits_fiscal_period_id_fiscal_periods_fk")
      .references("fiscal_periods.id")

    table.unique(["centre_id", "fiscal_period_id"], {
      indexName: "employee_benefits_centre_id_fiscal_period_id_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The employee_benefits baseline cannot be rolled back.")
}
