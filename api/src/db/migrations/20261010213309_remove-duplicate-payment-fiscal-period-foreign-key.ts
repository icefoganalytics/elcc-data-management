import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  const duplicateForeignKey = await knex("sys.foreign_keys")
    .where("parent_object_id", knex.raw("OBJECT_ID(?)", ["dbo.payments"]))
    .where("name", "FK__payments__fiscal__336AA144")
    .first()

  if (duplicateForeignKey === undefined) return

  const retainedForeignKey = await knex("sys.foreign_keys")
    .where("parent_object_id", knex.raw("OBJECT_ID(?)", ["dbo.payments"]))
    .where("name", "FK__payments__fiscal__32767D0B")
    .where("is_disabled", false)
    .where("is_not_trusted", false)
    .first()

  if (retainedForeignKey === undefined) {
    throw new Error(
      "Cannot remove the duplicate payments foreign key without its enforced counterpart."
    )
  }

  await knex.schema.alterTable("payments", (table) => {
    table.dropForeign("fiscal_period_id", "FK__payments__fiscal__336AA144")
  })
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Duplicate payments foreign key cleanup is irreversible; the duplicate will not be restored."
  )
}
