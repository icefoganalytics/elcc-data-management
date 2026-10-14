import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_reconciliation_adjustments", (table) => {
    table
      .decimal("funding_received_period_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("eligible_expenses_period_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("payroll_adjustments_period_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("cumulative_balance_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
  })
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Funding reconciliation adjustment default normalization is irreversible; canonical defaults are retained."
  )
}
