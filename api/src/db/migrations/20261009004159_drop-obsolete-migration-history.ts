import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("SequelizeMeta")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("Migration history cleanup is irreversible; removed history will not be restored.")
}
