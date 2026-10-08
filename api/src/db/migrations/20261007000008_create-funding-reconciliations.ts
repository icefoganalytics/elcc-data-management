import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("funding_reconciliations")) return

  await knex.schema.createTable("funding_reconciliations", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.integer("funding_period_id").notNullable()
    table.string("status", 20).notNullable().defaultTo("draft")
    table.decimal("funding_received_total_amount", 15, 4).notNullable().defaultTo(0)
    table.decimal("eligible_expenses_total_amount", 15, 4).notNullable().defaultTo(0)
    table.decimal("payroll_adjustments_total_amount", 15, 4).notNullable().defaultTo(0)
    table.decimal("final_balance_amount", 15, 4).notNullable().defaultTo(0)
    table.text("notes")
    table.specificType("finalized_at", "DATETIME2")
    table.integer("finalized_by_id")
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")

    table
      .foreign(["centre_id"], "FK__funding_r__centr__3DE82FB7")
      .references(["id"])
      .inTable("centres")

    table
      .foreign(["finalized_by_id"], "FK__funding_r__final__3FD07829")
      .references(["id"])
      .inTable("users")

    table
      .foreign(["funding_period_id"], "FK__funding_r__fundi__3EDC53F0")
      .references(["id"])
      .inTable("funding_periods")

    table.unique(["centre_id", "funding_period_id"], {
      indexName: "unique_funding_reconciliations_on_centre_id_funding_period_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The funding_reconciliations baseline cannot be rolled back.")
}
