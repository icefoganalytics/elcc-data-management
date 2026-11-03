import type { Knex } from "knex"

const tableRenames = [
  ["diverse_need_categories", "children_with_diverse_needs_categories"],
  ["diverse_needs", "children_with_diverse_needs"],
] as const

const indexRenames = [
  [
    "diverse_need_categories",
    "unique_diverse_need_categories_on_funding_period_id_and_category_name",
    "unique_children_with_diverse_needs_categories_on_funding_period_id_and_category_name",
  ],
  [
    "diverse_needs",
    "unique_diverse_needs_on_centre_id_fiscal_period_id_category_id",
    "unique_children_with_diverse_needs_on_centre_id_fiscal_period_id_category_id",
  ],
] as const

export async function up(knex: Knex): Promise<void> {
  for (const [oldName, newName] of tableRenames) {
    const hasOldTable = await knex.schema.hasTable(oldName)
    const hasNewTable = await knex.schema.hasTable(newName)
    if (hasOldTable && !hasNewTable) await knex.schema.renameTable(oldName, newName)
  }

  for (const [oldTableName, newTableName] of tableRenames) {
    const legacyTableName = oldTableName.replace("children_with_", "")
    const indexRename = indexRenames.find(([tableName]) => tableName === legacyTableName)
    if (indexRename === undefined || !(await knex.schema.hasTable(newTableName))) continue

    const [, oldIndexName, newIndexName] = indexRename
    const indexes = await knex.raw<{ name: string }[]>(
      "SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID(?) AND name IN (?, ?)",
      [newTableName, oldIndexName, newIndexName]
    )
    const names = new Set(indexes.map(({ name }) => name))
    if (names.has(oldIndexName) && !names.has(newIndexName)) {
      await knex.raw("EXEC sp_rename ?, ?, 'INDEX'", [
        `${newTableName}.${oldIndexName}`,
        newIndexName,
      ])
    }
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Data-preserving table renames are intentionally irreversible.
}
