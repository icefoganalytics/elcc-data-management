import type { Knex } from "knex"

import { replaceDefaultConstraint } from "@/db/utils/replace-default-constraint"

export async function up(knex: Knex): Promise<void> {
  await replaceDefaultConstraint(knex, "funding_regions", "hot_meal_increment_amount", "0", "((0))")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Funding region default normalization is irreversible; canonical defaults are retained."
  )
}
