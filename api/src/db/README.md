# Database & Migrations

Knex for migrations. Sequelize for ORM. Database: snake_case. Models: camelCase (Sequelize maps automatically).

## Migration Rules

- **ALWAYS use `dev migrate make <description>`** — never manually generate timestamps.
- Keep migrations clean — no extraneous comments.
- When adding non-null foreign keys to existing tables: add nullable → backfill → make non-null.
- Find system user by email (`system.user@yukon.ca`), not `auth0Subject`.
- Use proper TypeScript generics: `.returning<{ id: number }[]>(["id"])`.

## Foreign Key Pattern

Create the column first, then add the foreign key constraint separately:

```ts
table.integer("field_name").nullable()
table.foreign("field_name").references("users.id")
// .onDelete("SET NULL")  — add only if needed
```

In down migrations, always drop the foreign key before dropping the column.
