# Database & Migrations

Umzug for migrations. Sequelize for ORM. Database: snake_case. Models: camelCase (Sequelize maps automatically).

## Migration Rules

- **ALWAYS use `dev migrate make <description>`** — never manually generate timestamps.
- Keep migrations clean — no extraneous comments.
- Find system user by email (`system.user@yukon.ca`), not `auth0Subject`.

**Migration Patterns & Examples** → [`migrations/README.md`](migrations/README.md) - Detailed code examples and patterns for writing migrations.
