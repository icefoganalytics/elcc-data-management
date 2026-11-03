import type { Knex } from "knex"

const renames = [
  {
    from: "children_with_diverse_needs_categories",
    to: "children_with_diverse_needs_funding_categories",
    oldIndex:
      "unique_children_with_diverse_needs_categories_on_funding_period_id_and_category_name",
    newIndex:
      "unique_children_with_diverse_needs_funding_categories_on_funding_period_id_and_category_name",
  },
  {
    from: "children_with_diverse_needs",
    to: "children_with_diverse_needs_funding_records",
    oldIndex: "unique_children_with_diverse_needs_on_centre_id_fiscal_period_id_category_id",
    newIndex:
      "unique_children_with_diverse_needs_funding_records_on_centre_id_fiscal_period_id_category_id",
  },
] as const

export async function up(knex: Knex): Promise<void> {
  for (const { from, to, oldIndex, newIndex } of renames) {
    if (!(await knex.schema.hasTable(from))) continue
    if (await knex.schema.hasTable(to)) {
      throw new Error(`Cannot rename ${from}: ${to} already exists`)
    }
    await knex.schema.renameTable(from, to)
    const indexes = await knex.raw<{ name: string }[]>(
      "SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID(?) AND name = ?",
      [to, oldIndex]
    )
    if (indexes.length > 0) {
      await knex.raw("EXEC sp_rename ?, ?, 'INDEX'", [`${to}.${oldIndex}`, newIndex])
    }
  }
}

export async function down(): Promise<void> {
  throw new Error("Restore the pre-upgrade backup to reverse the funding table rename")
}
