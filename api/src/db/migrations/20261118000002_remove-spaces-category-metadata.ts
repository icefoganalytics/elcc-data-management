import type { Knex } from "knex"

import { removeDuplicatedMetadata } from "./helpers/cut-over-program-categories"

export async function up(knex: Knex): Promise<void> {
  await removeDuplicatedMetadata(knex, "child_care_space_categories")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Spaces category metadata cannot be reconstructed. Restore a pre-cutover database backup."
  )
}
