import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE fiscal_periods WITH (TABLOCKX)
    SET deleted_at = SWITCHOFFSET(deleted_at, '+00:00')
    WHERE deleted_at IS NOT NULL
  `)

  await knex.schema.alterTable("fiscal_periods", (table) => {
    table.dropUnique(["fiscal_year", "month"], "fiscal_periods_fiscal_year_month_unique")
    table.dropUnique(
      ["funding_period_id", "fiscal_year", "month"],
      "fiscal_periods_funding_period_id_fiscal_year_month_unique"
    )
  })

  await knex.schema.alterTable("fiscal_periods", (table) => {
    table.timestamp("deleted_at").nullable().alter()
    table.unique(["fiscal_year", "month"], {
      indexName: "fiscal_periods_fiscal_year_month_unique",
      predicate: knex.whereNull("deleted_at"),
    })
    table.unique(["funding_period_id", "fiscal_year", "month"], {
      indexName: "fiscal_periods_funding_period_id_fiscal_year_month_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("fiscal_periods", (table) => {
    table.dropUnique(["fiscal_year", "month"], "fiscal_periods_fiscal_year_month_unique")
    table.dropUnique(
      ["funding_period_id", "fiscal_year", "month"],
      "fiscal_periods_funding_period_id_fiscal_year_month_unique"
    )
  })

  await knex.schema.alterTable("fiscal_periods", (table) => {
    table.specificType("deleted_at", "DATETIMEOFFSET").nullable().alter()
    table.unique(["fiscal_year", "month"], {
      indexName: "fiscal_periods_fiscal_year_month_unique",
      predicate: knex.whereNull("deleted_at"),
    })
    table.unique(["funding_period_id", "fiscal_year", "month"], {
      indexName: "fiscal_periods_funding_period_id_fiscal_year_month_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}
