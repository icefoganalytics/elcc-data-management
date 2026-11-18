import type { Knex } from "knex"

import { removeDuplicatedMetadata } from "./helpers/cut-over-program-categories"

export async function up(knex: Knex): Promise<void> {
  await removeDuplicatedMetadata(knex, "administration_cost_categories")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("Administration category cutover cannot restore independent metadata. Recover a pre-cutover backup.")
}
