import type { Knex } from "knex"

import { replaceDefaultConstraint } from "@/db/utils/replace-default-constraint"

export async function up(knex: Knex): Promise<void> {
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliations",
    "status",
    "N'draft'",
    "(N'draft')"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliations",
    "funding_received_total_amount",
    "0",
    "((0))"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliations",
    "eligible_expenses_total_amount",
    "0",
    "((0))"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliations",
    "payroll_adjustments_total_amount",
    "0",
    "((0))"
  )
  await replaceDefaultConstraint(
    knex,
    "funding_reconciliations",
    "final_balance_amount",
    "0",
    "((0))"
  )
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Funding reconciliation default normalization is irreversible; canonical defaults are retained."
  )
}
