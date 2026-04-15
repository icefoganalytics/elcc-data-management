# API — Backend Patterns & Conventions

Node.js + Express + TypeScript. Sequelize 7 ORM + Knex migrations. MSSQL database.

---

## Code Style

- TypeScript only — no `any`, `as` casts, `@ts-expect-error`, `@ts-ignore`, or `!` non-null assertions. Use `instanceof` narrowing with fallbacks instead.
- **Use `type` not `interface`** — `interface` has unexpected side-effects (declaration merging).
- Optional chaining (`?.`) and nullish coalescing (`??`) for null handling.
- 2 spaces, no semicolons, double quotes, 100 char line limit.
- **No abbreviations** — full descriptive names (`fundingSubmission` not `fs`).
- **Number similar entities:** `user1`, `user2` (not `existingUser`, `newUser`).
- **Expanded code style:** one thing per line, avoid terse functional chains.
- **Guard clauses:** early returns with a blank line after each guard.
- **Named constants:** hoist magic numbers to named `const`.
- camelCase for variables/functions, PascalCase for classes/types.
- **Import formatting:** multi-line expanded imports for 4+ named items.
- **Extract and rename pattern:** extract and rename on separate lines before constructing objects:
  ```typescript
  // Good
  const { order: fundingSubmissionOrder } = this.fundingSubmission
  const data = { fundingSubmissionOrder, ...otherProps }

  // Bad
  const data = { fundingSubmissionOrder: this.fundingSubmission.order, ...otherProps }
  ```
- **Orchestrate up front:** load associations near the top-level `perform()`, pass simple values into helpers — don't hide async lookups inside helpers.

**Import ordering (PEP8-style):**

1. Node.js built-ins
2. _(blank line)_
3. External packages from node_modules
4. _(blank line)_
5. Internal imports from `@/` (alphabetical preferred)

---

## Subsystem Documentation

- **Services** → [`src/services/README.md`](src/services/README.md)
- **Controllers** → [`src/controllers/README.md`](src/controllers/README.md)
- **Policies** → [`src/policies/README.md`](src/policies/README.md)
- **Models** → [`src/models/README.md`](src/models/README.md)
- **Serializers** → [`src/serializers/README.md`](src/serializers/README.md)
- **Database & Migrations** → [`src/db/README.md`](src/db/README.md)
- **Testing** → [`tests/README.md`](tests/README.md)
