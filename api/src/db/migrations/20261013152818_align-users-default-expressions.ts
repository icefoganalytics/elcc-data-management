import type { Knex } from "knex"

import { replaceDefaultConstraint } from "@/db/utils/replace-default-constraint"

export async function up(knex: Knex): Promise<void> {
  await replaceDefaultConstraint(knex, "users", "is_admin", "0", "((0))")
  await replaceDefaultConstraint(knex, "users", "roles", "N'user'", "(N'user')")
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("User default normalization is irreversible; canonical defaults are retained.")
}
