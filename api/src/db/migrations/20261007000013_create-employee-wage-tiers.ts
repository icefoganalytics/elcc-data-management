import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("employee_wage_tiers")) return

  await knex.schema.createTable("employee_wage_tiers", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("fiscal_period_id").notNullable()
    table.integer("tier_level").notNullable()
    table.string("tier_label", 50).notNullable()
    table.decimal("wage_rate_per_hour", 10, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table
      .foreign("fiscal_period_id", "FK__employee___fisca__2AD55B43")
      .references("fiscal_periods.id")

    table.unique(["fiscal_period_id", "tier_level"], {
      indexName: "employee_wage_tiers_on_fiscal_period_id_tier_level_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The employee_wage_tiers baseline cannot be rolled back.")
}
