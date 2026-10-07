# Knex Migration Patterns

Use this directory for every migration created after the Knex transition. The Knex baseline migration
creates the production schema only for a database without a historical Umzug ledger. Existing
databases first complete their historical ledger, then record the Knex migrations without replaying
their schema changes.

The transition marker retains both previously recorded filenames so databases that ran an earlier
branch revision can continue without a corrupt Knex ledger.


## Commands

```bash
# Create a new migration
./bin/dev migrate make add-field-to-table

# Run the complete production-safe migration pipeline
./bin/dev migrate

# Inspect Knex migration status
./bin/dev migrate list
```

Do not run a Knex rollback in production. It cannot reverse the historical Umzug migration history.

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
