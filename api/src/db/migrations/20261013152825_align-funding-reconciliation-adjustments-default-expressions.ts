import type { Knex } from "knex"

import { replaceDefaultConstraint } from "@/db/utils/replace-default-constraint"

export async function up(knex: Knex): Promise<void> {
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliation_adjustments",
    "funding_received_period_amount",
    "0",
    "((0))"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliation_adjustments",
    "eligible_expenses_period_amount",
    "0",
    "((0))"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliation_adjustments",
    "payroll_adjustments_period_amount",
    "0",
    "((0))"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliation_adjustments",
    "cumulative_balance_amount",
    "0",
    "((0))"
  )
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Funding reconciliation adjustment default normalization is irreversible; canonical defaults are retained."
  )
}
