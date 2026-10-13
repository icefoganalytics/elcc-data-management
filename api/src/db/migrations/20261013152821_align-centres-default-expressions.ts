import type { Knex } from "knex"

import { replaceDefaultConstraint } from "@/db/utils/replace-default-constraint"

export async function up(knex: Knex): Promise<void> {
  await replaceDefaultConstraint(knex, "centres", "hot_meal", "0", "((0))")
  await replaceDefaultConstraint(knex, "centres", "is_first_nation_program", "0", "((0))")
  await replaceDefaultConstraint(knex, "centres", "building_usage_percent", "100", "((100))")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("Centre default normalization is irreversible; canonical defaults are retained.")
}
