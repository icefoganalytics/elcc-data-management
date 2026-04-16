# Migration Patterns

This document contains detailed patterns and examples for writing database migrations.

**Database Overview & Rules** → [`../README.md`](../README.md) - High-level database architecture and migration rules.

## File Structure

- Use timestamp format: `YYYY.MM.DDTHH.mm.ss.description.ts`
- Separate schema changes from data backfills
- Use descriptive file names that clearly indicate the purpose

## Schema Changes vs Data Backfills

### Schema Changes (use `queryInterface`)

Use for table/column operations, indexes, constraints:

```typescript
import { DataTypes } from "@sequelize/core"
import { type Migration } from "@/db/umzug"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.addColumn("table", "new_field", {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: "0.0000",
  })
}

export async function down({ context: queryInterface }: Migration) {
  await queryInterface.removeColumn("table", "new_field")
}
```

### Data Backfills (use `sequelize.query`)

Use for populating data, updating existing records:

```typescript
import { QueryTypes, sql } from "@sequelize/core"
import { type Migration } from "@/db/umzug"

export async function up({ context: { sequelize } }: Migration) {
  await sequelize.query(
    sql`UPDATE table SET new_field = '32.0600' WHERE new_field = '0.0000'`,
    { type: QueryTypes.UPDATE }
  )
}

export async function down({ context: _queryInterface }: Migration) {
  // No down migration - we don't want to revert this backfill because we cannot
  // reliably determine if the data had been edited after the fact
}
```

## Field Types & Defaults

### Decimal Fields
- Use `DataTypes.DECIMAL(precision, scale)` for financial values
- Set `allowNull: false` for financial amounts
- Use `defaultValue: "0.0000"` for decimal fields
- Always use string values for decimal amounts

### Example: Adding Financial Field
```typescript
await queryInterface.addColumn("funding_regions", "hotMealIncrementAmount", {
  type: DataTypes.DECIMAL(10, 4),
  allowNull: false,
  defaultValue: "0.0000",
})
```

## SQL Query Style

### Use SQL Template Literals
```typescript
import { QueryTypes, sql } from "@sequelize/core"

await sequelize.query(
  sql`SELECT * FROM table WHERE condition = :value`,
  {
    type: QueryTypes.SELECT,
    replacements: { value: "some_value" }
  }
)
```

### QueryTypes
Always specify the appropriate `QueryTypes`:
- `QueryTypes.SELECT` - For SELECT queries
- `QueryTypes.UPDATE` - For UPDATE queries
- `QueryTypes.INSERT` - For INSERT queries
- `QueryTypes.DELETE` - For DELETE queries

## Context Destructuring

### Schema Changes
```typescript
export async function up({ context: queryInterface }: Migration) {
  // Use queryInterface for schema operations
}
```

### Data Operations
```typescript
export async function up({ context: { sequelize } }: Migration) {
  // Use sequelize for SQL queries
}
```

## Complete Examples

### Adding Field with Backfill

**Schema Migration** (`add-hot-meal-increment.ts`):
```typescript
import { DataTypes } from "@sequelize/core"
import { type Migration } from "@/db/umzug"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.addColumn("funding_regions", "hotMealIncrementAmount", {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: "0.0000",
  })
}

export async function down({ context: queryInterface }: Migration) {
  await queryInterface.removeColumn("funding_regions", "hotMealIncrementAmount")
}
```

**Backfill Migration** (`backfill-hot-meal-increment.ts`):
See Data Backfills section above for complete backfill pattern and standards.

## Non-Null Foreign Key Pattern

When adding non-null foreign keys to existing tables, follow this three-step process:

```typescript
// Step 1: Add nullable column
await queryInterface.addColumn("table", "foreign_key_field", {
  type: DataTypes.INTEGER,
  allowNull: true,
})

// Step 2: Backfill data (in separate migration)
await sequelize.query(
  sql`UPDATE table SET foreign_key_field = :value WHERE condition`,
  {
    type: QueryTypes.UPDATE,
    replacements: { value: 1 }
  }
)

// Step 3: Make column non-null
await queryInterface.changeColumn("table", "foreign_key_field", {
  type: DataTypes.INTEGER,
  allowNull: false,
})
```

## Foreign Key Pattern

Create the column first, then add the foreign key constraint separately:

```typescript
// In up migration
await queryInterface.addColumn("table", "foreign_key_field", {
  type: DataTypes.INTEGER,
  allowNull: true,
})

await queryInterface.addConstraint("table", {
  fields: ["foreign_key_field"],
  type: "foreign key",
  name: "table_foreign_key_field_fkey",
  references: {
    table: "other_table",
    field: "id",
  },
  onDelete: "SET NULL", // Add only if needed
})

// In down migration - always drop foreign key before column
await queryInterface.removeConstraint("table", "table_foreign_key_field_fkey")
await queryInterface.removeColumn("table", "foreign_key_field")
```

## TypeScript Generics

Use proper TypeScript generics for type-safe query results:

```typescript
// For single record
const [user] = await sequelize.query<{ id: number; email: string }>(
  sql`SELECT id, email FROM users WHERE id = :id`,
  {
    type: QueryTypes.SELECT,
    replacements: { id: userId }
  }
)

// For multiple records
const users = await sequelize.query<{ id: number; email: string }>(
  sql`SELECT id, email FROM users WHERE active = true`,
  { type: QueryTypes.SELECT }
)

// For insert/update operations
const result = await sequelize.query<{ id: number }>(
  sql`INSERT INTO users (email) VALUES (:email) RETURNING id`,
  {
    type: QueryTypes.INSERT,
    replacements: { email: "test@example.com" }
  }
)
```

## Migration Organization

### Split Data Operations by Table
- Create separate migrations for each table being modified
- Don't combine multiple table updates in a single migration
- Use symmetric naming patterns for related migrations

### Migration Ordering
- Update base tables before JSON values that reference them
- Use timestamps to ensure proper execution order
- Example: `2026.04.16T08.30.59.table-name.ts` runs before `2026.04.16T08.31.00.other-table.ts`

## Backfill Migration Standards

All backfill migration standards are documented in the **Data Backfills** section above, including:
- Proper context destructuring using `{ context: { sequelize } }`
- Down migration comments explaining why reversions are not implemented
- Formal grammar standards ("cannot" instead of "couldn't")
- SQL template literal usage with QueryTypes

## Code Quality

- No extraneous comments
- Clean, concise code
- Proper imports and typing
- Follow existing patterns in the codebase
