import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE employee_benefits WITH (TABLOCKX)
    SET deleted_at = SWITCHOFFSET(deleted_at, '+00:00')
    WHERE deleted_at IS NOT NULL
  `)

  await knex.schema.alterTable("employee_benefits", (table) => {
    table.dropUnique(
      ["centre_id", "fiscal_period_id"],
      "employee_benefits_centre_id_fiscal_period_id_unique"
    )
  })

  await knex.schema.alterTable("employee_benefits", (table) => {
    table.timestamp("deleted_at").nullable().alter()
    table.unique(["centre_id", "fiscal_period_id"], {
      indexName: "employee_benefits_centre_id_fiscal_period_id_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("employee_benefits", (table) => {
    table.dropUnique(
      ["centre_id", "fiscal_period_id"],
      "employee_benefits_centre_id_fiscal_period_id_unique"
    )
  })

  await knex.schema.alterTable("employee_benefits", (table) => {
    table.specificType("deleted_at", "DATETIMEOFFSET").nullable().alter()
    table.unique(["centre_id", "fiscal_period_id"], {
      indexName: "employee_benefits_centre_id_fiscal_period_id_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}
