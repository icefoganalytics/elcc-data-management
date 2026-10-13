import type { Knex } from "knex"

type DefaultConstraint = {
  name: string
  definition: string
}

export async function replaceDefaultConstraint(
  knex: Knex,
  tableName: string,
  columnName: string,
  expression: string,
  definition: string
): Promise<void> {
  const tableIdentifier = `[dbo].${quoteIdentifier(tableName)}`
  const defaultConstraint = await knex<DefaultConstraint>("sys.default_constraints")
    .join("sys.columns", "sys.columns.default_object_id", "sys.default_constraints.object_id")
    .where("sys.columns.object_id", knex.raw("OBJECT_ID(?)", [tableIdentifier]))
    .where("sys.columns.name", columnName)
    .select("sys.default_constraints.name", "sys.default_constraints.definition")
    .first()

  if (defaultConstraint?.definition === definition) return

  const constraintName = defaultConstraint?.name ?? `${tableName}_${columnName}_default`
  const constraintIdentifier = quoteIdentifier(constraintName)
  const columnIdentifier = quoteIdentifier(columnName)

  if (defaultConstraint !== undefined) {
    await knex.raw(`ALTER TABLE ${tableIdentifier} DROP CONSTRAINT ${constraintIdentifier}`)
  }

  await knex.raw(
    `ALTER TABLE ${tableIdentifier} ADD CONSTRAINT ${constraintIdentifier} DEFAULT ? FOR ${columnIdentifier}`,
    [knex.raw(expression)]
  )
}

// Knex's MSSQL identifier formatter strips brackets instead of escaping them.
function quoteIdentifier(identifier: string): string {
  return `[${identifier.replace(/]/g, "]]")}]`
}
