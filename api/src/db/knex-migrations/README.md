# Knex Migration Patterns

Use this directory for every migration created after the Knex transition. The migration pipeline
first applies the historical Umzug migrations in `../migrations/`, then runs these migrations.
That ordering preserves the `SequelizeMeta` ledger used by existing production databases.

## Commands

```bash
# Create a new migration
./bin/dev migrate make add-field-to-table

# Run the complete production-safe migration pipeline
./bin/dev api npm run migrate

# Inspect Knex migration status
./bin/dev api npm run migrate:list
```

Do not run `migrate:rollback` in production. It only operates on the Knex ledger and cannot
reverse the historical Umzug migration history.

## Migration Structure

```typescript
import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("table_name", (table) => {
    table.string("field_name", 100)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("table_name", (table) => {
    table.dropColumn("field_name")
  })
}
```

Separate schema changes from data backfills. Use a descriptive timestamped filename and make
backfills idempotent.
