# Knex Migration Patterns

Use this directory for all migrations. Create one migration per application model or inseparable
group of related models; separate schema changes from data backfills.

## Commands

```bash
./bin/dev migrate make add-field-to-table
./bin/dev migrate
./bin/dev migrate list
```

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

Use SQL `DECIMAL` types for financial values and snake_case for database names.
Use `GETUTCDATE()` for timestamp defaults. Unique indexes on paranoid models must exclude
soft-deleted rows, using `predicate: knex.whereNull("deleted_at")`.

Use scalar column names and dotted references for single-column foreign keys:

```typescript
table.foreign("centre_id", "constraint_name").references("centres.id")
```

Preserve existing constraint names and cascade actions when refactoring; use arrays for composite keys.

The initial `create-*` migrations use `knex.schema.hasTable` to leave existing tables untouched.
They are a fresh-install baseline, not an upgrade path for old application schemas.
Their `down` methods throw instead of dropping tables. Inspect a restored production backup
before cutover; leave its unused `SequelizeMeta` history intact.

Knex uses its native filename-based history and migration lock. Do not rename ledger entries,
retain obsolete transition-marker files, or add a second migration directory.
