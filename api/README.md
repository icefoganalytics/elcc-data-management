# API — Backend Patterns & Conventions

Node.js + Express + TypeScript. Sequelize 7 ORM, Knex migrations and seeds, MSSQL database.

---

## Authentication Boundary

Register public API-independent endpoints, such as `/_status`, before the shared `/api`
authentication middleware in `src/router.ts`. Mount every protected endpoint and child router
after that middleware so JWT verification and user loading run before any API action.
Child routers inherit authentication; do not register it again on individual routes or routers.
Keep role and record-level authorization in the existing middleware and policies.

Frontend static files and SPA routes remain outside `/api` and do not require an API token.

---

## Shared Authoring and Local Style

Load the direct MSSRT backend/readability/review sources declared in [root guidance](/AGENTS.md#shared-standards-and-local-authority), then apply the subsystem READMEs below. [ELCC review constraints](/agents/workflows/code-review.md#local-constraints) own the TypeScript safety and necessary assignment/creation-time cast policy; do not maintain a competing blanket cast ban here.

Backend-specific conventions:

- Use `type` rather than `interface` to avoid declaration merging.
- Follow [the formatter configuration](/.prettierrc.yaml): two spaces, no semicolons, double quotes, and a 100-character print width.
- Use camelCase for variables/functions and PascalCase for classes/types. Number equivalent entities as `user1`, `user2`, not `existingUser`, `newUser`.
- Expand imports with four or more named members across multiple lines.
- The backend import-order exception is Node.js built-ins, external packages, then `@/` imports, with one blank line between groups. Alphabetical order within a group is preferred for new or intentionally changed imports; do not reorder unrelated imports.
- Preserve the extract-and-rename pattern when a field changes names across a boundary:

  ```typescript
  const { order: fundingSubmissionOrder } = this.fundingSubmission
  const data = { fundingSubmissionOrder, ...otherProps }
  ```

Shared service orchestration guidance owns association preconditions, explicit value handoffs, and visible side effects; [service conventions](src/services/README.md) retain ELCC's persistence and financial constraints.

---

## Subsystem Documentation

- **Services** → [`src/services/README.md`](src/services/README.md)
- **Controllers** → [`src/controllers/README.md`](src/controllers/README.md)
- **Policies** → [`src/policies/README.md`](src/policies/README.md)
- **Models** → [`src/models/README.md`](src/models/README.md)
- **Serializers** → [`src/serializers/README.md`](src/serializers/README.md)
- **Database & Migrations** → [`src/db/README.md`](src/db/README.md)
- **Testing** → [`tests/README.md`](tests/README.md)
