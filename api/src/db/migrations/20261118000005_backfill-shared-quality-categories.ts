import type { Knex } from "knex"

import { backfillProgramCategories } from "./helpers/cut-over-program-categories"

export async function up(knex: Knex): Promise<void> {
  await backfillProgramCategories(knex, "quality_enhancement_categories")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("Quality category cutover cannot restore independent metadata. Recover a pre-cutover backup.")
}
