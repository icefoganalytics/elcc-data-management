# Agent Guidelines for ELCC Data Management

ELCC Data Management is a web application for tracking government contributions to child care services.

This file follows the format from https://agents.md/ for AI agent documentation.

## Documentation Philosophy

**Documentation philosophy:** This file focuses on patterns, conventions, and architecture rather than documenting specific features or domain models. Examples illustrate patterns, not exhaustive feature documentation.
Less is more: prefer the smallest guidance, implementation, or abstraction that fully solves the problem. A thing is complete not when there is nothing left to add, but when there is nothing left to take away.
Do not remove durable reference material that is hard to rediscover later, such as known-good test inputs, sample payloads, or validated reference values.

Keep `AGENTS.md` focused on project-wide conventions and high-level concepts. When guidance becomes specific to a subsystem or directory, move it into the nearest `README.md` or `agents/` workflow document and link to it from here.

---

## Shared Standards and Local Authority

Generic authoring, review, and delivery standards belong to [marlens-skills-rules-and-tools (MSSRT)](https://github.com/klondikemarlen/marlens-skills-rules-and-tools). Use the task-relevant direct shared document below first, then its ELCC overlay. Do not invoke a selecting skill from its own overlay: that can route back into the same file.

| Task                                                 | Direct shared base                                                                                                                                                                                                                                                                                                                                              | ELCC overlay                                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Readability and code organization                    | `skill://readable-code/workflow.md`                                                                                                                                                                                                                                                                                                                             | Source-adjacent READMEs and the local constraints below                                                                                                                     |
| Review                                               | `skill://code-review/workflow.md`                                                                                                                                                                                                                                                                                                                               | [Review constraints](agents/workflows/code-review.md)                                                                                                                       |
| Test authoring and review                            | [Scenario-Oriented Verification](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/code-organization-reference.md#scenario-oriented-verification) and [test baseline](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/test-alignment-verifier-reference.md#shared-baseline) | [API tests](api/tests/README.md), [web tests](web/tests/README.md)                                                                                                          |
| Backend authoring                                    | `skill://express-light-rail/workflow.md`                                                                                                                                                                                                                                                                                                                        | [Controllers](api/src/controllers/README.md), [services](api/src/services/README.md), and adjacent policy/model/serializer guidance                                         |
| Vue authoring                                        | [Vue component authoring](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/vue-component-authoring-reference.md)                                                                                                                                                                                                      | [Components](web/src/components/README.md), [composables](web/src/use/README.md), [pages](web/src/pages/README.md), and [admin recipe](agents/workflows/create-admin-ui.md) |
| Pull requests                                        | `skill://pull-request-management/workflow.md`                                                                                                                                                                                                                                                                                                                   | [PR conventions](agents/workflows/pull-request-management.md)                                                                                                               |
| Testing instructions                                 | `skill://testing-instructions/workflow.md`                                                                                                                                                                                                                                                                                                                      | [ELCC verification](agents/workflows/testing-instructions.md)                                                                                                               |
| Jira reports, when Jira is the authoritative tracker | `skill://jira-reporting/workflow.md`                                                                                                                                                                                                                                                                                                                            | [ELCC ticket context](agents/workflows/jira-issue-management.md)                                                                                                            |

Resolve shared workflows, references, and templates from the same available MSSRT release. OMP's direct `skill://` documents resolve installed workflows; the public links identify the corresponding repository paths to read in that selected release. Other clients must resolve those paths in an available release before use. Confirm source availability and record the observed version/source in the task's existing evidence, not a permanent version inventory. A missing required source blocks the affected adoption/task; do not install automatically, fall back to moving `main`, or reconstruct rules from memory.

ELCC domain, financial, security, runtime, command, and deliberate local exceptions retain precedence. For a real conflict, preserve local coverage and obtain the project owner's decision before deleting or overriding it. Documentation adoption does not authorize executable library/tooling adoption; that needs separate artifact and compatibility proof.

Discover current local extensions through [agents](agents/README.md) and durable project knowledge through [docs](docs/README.md). Route reusable standards corrections to MSSRT and project-specific corrections here; a proposal or issue is not activated policy or runtime verification.

---

## Technology Stack

- **Backend:** Node.js + Express + TypeScript, Sequelize 7 + Knex migrations → [`api/README.md`](api/README.md)
- **Frontend:** Vue 3 + Vuetify 3, TypeScript, Vite, Pinia → [`web/README.md`](web/README.md)
- **Database:** Microsoft SQL Server 2019
- **Testing:** Vitest
- **Infrastructure:** Docker Compose

Useful local documentation:

- [README.md](./README.md)
- [COMMITTING.md](./COMMITTING.md) - Commit message guidelines, standards, and techniques
- [bin/README.md](./bin/README.md)
- [api/src/controllers/README.md](./api/src/controllers/README.md)
- [api/src/models/README.md](./api/src/models/README.md)
- [api/src/services/README.md](./api/src/services/README.md)
- [api/src/serializers/README.md](./api/src/serializers/README.md)
- [api/src/db/README.md](./api/src/db/README.md) - Database & migration rules
- [api/src/db/migrations/README.md](./api/src/db/migrations/README.md) - Migration patterns & examples
- [api/tests/README.md](./api/tests/README.md)
- [web/src/api/README.md](./web/src/api/README.md)
- [web/src/components/README.md](./web/src/components/README.md)
- [web/src/pages/README.md](./web/src/pages/README.md)
- [web/src/use/README.md](./web/src/use/README.md)
- [agents/README.md](./agents/README.md)
- [agents/workflows/README.md](./agents/workflows/README.md)

## Development Approach

Use the shared authoring and review bases above with nearby live ELCC implementations. Keep project-specific architecture and operator knowledge in the linked local documentation rather than copying shared checklists.

Apply the project's [current scale and engineering tradeoffs](/docs/README.md#current-scale-and-engineering-tradeoffs) when choosing implementation complexity.

## Development Environment

For initial environment setup, see [README.md](./README.md).

### Common Commands

Development primarily uses `./bin/dev`. If `direnv` is active, `dev` may also work as a shortcut. Keep `dev`-specific usage in [bin/README.md](./bin/README.md).

Common entry points:

```bash
./bin/dev up --build
./bin/dev test_api
./bin/dev test_web
./bin/dev api npm run check-types
./bin/dev web npm run check-types
```

Use `./bin/dev up --build` for both the base checkout and worktrees: it derives the checkout's
Compose project name, gateway hostname, and editor session automatically. See
[editor bridge setup](bin/README.md#editor-bridge) for upgrade requirements and listener security.

### Project Structure

```text
api/    Express + Sequelize backend
web/    Vue 3 + Vuetify frontend
bin/    Development helper scripts
```

Backend request flow:

```text
Route -> Controller -> Policy -> Service -> Model -> Serializer -> Response
```

Frontend responsibility split:

```text
Parent discovers data -> Child displays or edits a specific record
```

## Frontend Patterns

Keep detailed frontend guidance in:

- [web/src/components/README.md](./web/src/components/README.md)
- [web/src/pages/README.md](./web/src/pages/README.md)
- [web/src/use/README.md](./web/src/use/README.md)
- [web/src/api/README.md](./web/src/api/README.md)

Project-wide frontend conventions:

- Prefer dedicated pages over dialogs for complex workflows.
- Keep parent components responsible for querying and filtering. Child components should work from stable ids or already-resolved records.
- Handle loading, empty, error, and success states explicitly.
- Organize routes and files by domain with predictable route-name-to-file-path mapping.

### Financial Precision

Financial calculations must minimize rounding error and remain reproducible.

- Never use JavaScript arithmetic operators on financial values.
- Financial values are strings in TypeScript, not `number`.
- Use SQL `DECIMAL` types for storage.
- Use `big.js` for arithmetic.
- Use string literals in tests, such as `"100.50"`.
- Use `.toFixed(4)` for money and `.toFixed(2)` for percentages or hours.

## Backend Patterns

Keep detailed backend guidance in:

- [api/src/controllers/README.md](./api/src/controllers/README.md)
- [api/src/models/README.md](./api/src/models/README.md)
- [api/src/services/README.md](./api/src/services/README.md)
- [api/src/serializers/README.md](./api/src/serializers/README.md)

Project-wide backend conventions:

- Controllers coordinate requests, policies authorize, services hold business logic, models persist, and serializers shape responses.
- In models, prefer section order `Fields -> Helpers -> Associations -> Static methods`.
- Use getters for computed properties that do not take parameters.
- Use plural enum names and expose enums through the model when convenient.
- Use `CreationOptional` only for non-nullable database fields with defaults.
- Name scopes for the relationship or business rule, not the parameter type:
  - `byFundingPeriod`
  - `byCentre`
- Sequelize paranoid mode is enabled by default. Include `deletedAt` on models that persist data and exclude soft-deleted rows from unique indexes.
- Seeds should be idempotent and use memory-efficient iteration when walking large tables.

### SQL Patterns

- Wrap all subqueries in parentheses.
- For composable Sequelize subqueries, prefer the `id: { [Op.in]: subquery }` pattern.
- When excluding rows with a related match, prefer correlated `NOT EXISTS` predicates over client-built exclusion lists and over `NOT IN`.

## Testing Conventions

Load the shared test sources declared above, then [API test conventions](api/tests/README.md) or [web test conventions](web/tests/README.md). These local overlays own the Vitest harness, canonical wrapper commands, database isolation/concurrency, and deliberate assertion exceptions.

## Authentication and Authorization

- All routes require authentication by default.
- Define public routes first, then apply authentication middleware to the protected route tree.
- Do not add ad hoc per-route authentication when the route should live under the protected `/api` area.
- Keep authorization decisions in policies.

## Changelog Management

- Maintain a single canonical [CHANGELOG.md](./CHANGELOG.md) in the origin repository.
- Use Keep a Changelog structure with `## [Unreleased]` at the top.
- Track upstream releases with time-based versions: `vYYYY.MM.DD.x`.
- Keep origin-only work under `Unreleased` until it becomes part of an upstream release.
- Write user-facing entries grouped by theme, not commit-log summaries.
- For pull requests that change user-visible behavior or database schema, add at least one `Unreleased` entry unless the change is pure refactoring or tests.

## Pull Request Documentation

Pull requests follow [`.github/pull_request_template.md`](./.github/pull_request_template.md).

### Implementation

- Use a numbered list of high-level technical changes.
- Group by architectural concern or dependency order.
- Focus on what changed, not file-by-file narration.

### Testing Instructions

- Provide step-by-step verification for the main user-facing changes.
- Include the relevant automated checks.
- Include feature-specific manual verification when needed.
