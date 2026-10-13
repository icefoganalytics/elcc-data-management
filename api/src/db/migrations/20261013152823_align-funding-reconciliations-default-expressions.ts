import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_reconciliations", (table) => {
    table
      .string("status", 20)
      .notNullable()
      .defaultTo(knex.raw("N'draft'"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("funding_received_total_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("eligible_expenses_total_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("payroll_adjustments_total_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .decimal("final_balance_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
  })
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Funding reconciliation default normalization is irreversible; canonical defaults are retained."
  )
}
