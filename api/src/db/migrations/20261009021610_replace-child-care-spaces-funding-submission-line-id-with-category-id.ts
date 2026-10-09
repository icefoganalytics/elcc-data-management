import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("child_care_spaces", (table) => {
    table.integer("category_id").notNullable().alter()
    table.dropUnique(
      ["centre_id", "fiscal_period_id", "funding_submission_line_id"],
      "unique_child_care_spaces_on_centre_id_fiscal_period_id_funding_submission_line_id"
    )
    table.dropForeign("funding_submission_line_id")
    table.dropColumn("funding_submission_line_id")
    table.unique(["centre_id", "fiscal_period_id", "category_id"], {
      indexName: "unique_child_care_spaces_on_centre_id_fiscal_period_id_category_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("Restoring legacy Child Care Spaces configuration requires the original data.")
}
