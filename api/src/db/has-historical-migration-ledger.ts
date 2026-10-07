import type { Knex } from "knex"

const finalHistoricalMigrationNames = [
  "2026.04.16T16.00.00.make-hot-meal-not-nullable.ts",
  "2026.04.16T16.00.00.make-hot-meal-not-nullable.js",
]

const previousBaselineMigrationName = "20261007000000_establish-production-schema"

const applicationTableNames = [
  "funding_periods",
  "funding_regions",
  "funding_submission_lines",
  "logs",
  "users",
  "building_expense_categories",
  "centres",
  "fiscal_periods",
  "funding_reconciliations",
  "funding_submission_line_jsons",
  "payments",
  "building_expenses",
  "employee_benefits",
  "employee_wage_tiers",
  "funding_reconciliation_adjustments",
  "wage_enhancements",
]

export async function hasCompletedHistoricalMigrationLedger(knex: Knex): Promise<boolean> {
  if (!(await knex.schema.hasTable("SequelizeMeta"))) return false

  const completedMigration = await knex("SequelizeMeta")
    .whereIn("name", finalHistoricalMigrationNames)
    .first("name")

  if (completedMigration) return true

  throw new Error("The historical migration ledger is incomplete.")
}

async function hasCompletedPreviousBaseline(knex: Knex): Promise<boolean> {
  if (!(await knex.schema.hasTable("knex_migrations"))) return false

  const completedMigration = await knex("knex_migrations")
    .where({ name: previousBaselineMigrationName })
    .first("id")

  if (!completedMigration) return false

  for (const tableName of applicationTableNames) {
    if (!(await knex.schema.hasTable(tableName))) return false
  }

  return true
}

export async function assertApplicationSchemaIsEmpty(knex: Knex): Promise<void> {
  if (
    (await hasCompletedHistoricalMigrationLedger(knex)) ||
    (await hasCompletedPreviousBaseline(knex))
  ) {
    return
  }

  for (const tableName of applicationTableNames) {
    if (await knex.schema.hasTable(tableName)) {
      throw new Error(
        `Cannot establish the production schema because ${tableName} exists without a migration ledger.`
      )
    }
  }
}

export async function shouldSkipBaselineTableCreation(
  knex: Knex,
  _tableName: string
): Promise<boolean> {
  return (
    (await hasCompletedHistoricalMigrationLedger(knex)) ||
    (await hasCompletedPreviousBaseline(knex))
  )
}
