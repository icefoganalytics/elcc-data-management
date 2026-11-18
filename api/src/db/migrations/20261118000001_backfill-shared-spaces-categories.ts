import type { Knex } from "knex"

import { backfillProgramCategories } from "./helpers/cut-over-program-categories"

export async function up(knex: Knex): Promise<void> {
  await backfillProgramCategories(knex, "child_care_space_categories")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Spaces shared category identities are retained to preserve historical references."
  )
}
