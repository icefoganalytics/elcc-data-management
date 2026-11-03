import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE employee_wage_tiers
    WITH
      (TABLOCKX)
    SET
      deleted_at = SWITCHOFFSET(deleted_at, '+00:00')
    WHERE
      deleted_at IS NOT NULL
  `)

  await knex.schema.alterTable("employee_wage_tiers", (table) => {
    table.dropUnique(
      ["fiscal_period_id", "tier_level"],
      "employee_wage_tiers_on_fiscal_period_id_tier_level_unique"
    )
  })

  await knex.schema.alterTable("employee_wage_tiers", (table) => {
    table.timestamp("deleted_at").nullable().alter()
    table.unique(["fiscal_period_id", "tier_level"], {
      indexName: "employee_wage_tiers_on_fiscal_period_id_tier_level_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("employee_wage_tiers", (table) => {
    table.dropUnique(
      ["fiscal_period_id", "tier_level"],
      "employee_wage_tiers_on_fiscal_period_id_tier_level_unique"
    )
  })

  await knex.schema.alterTable("employee_wage_tiers", (table) => {
    table.specificType("deleted_at", "DATETIMEOFFSET").nullable().alter()
    table.unique(["fiscal_period_id", "tier_level"], {
      indexName: "employee_wage_tiers_on_fiscal_period_id_tier_level_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}
