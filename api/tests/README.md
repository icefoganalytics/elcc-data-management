# API Tests

Use API tests to prove ELCC's current application behavior and maintained domain invariants. Choose the suite by the responsibility being exercised, not by the implementation that a feature replaced. Test commands, database isolation, dependency refresh, and editor configuration belong in [bin guidance](/bin/README.md#api-test-commands-and-isolation).

Use the [Code Review Workflow](skill://code-review/workflow.md), [Scenario-Oriented Verification](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/code-organization-reference.md#scenario-oriented-verification), and [Test Alignment Baseline](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/test-alignment-verifier-reference.md#shared-baseline) for shared test design. The [Factory Trait Workflow](skill://test-factory-traits-and-service-shape/workflow.md) governs reusable persisted relationship setup. Apply the root [shared-standards source contract](/AGENTS.md#shared-standards-and-local-authority); this guide retains ELCC's test-layer and harness constraints.

## Choose the Test Boundary

- Model tests prove application-owned validation, calculations, scopes, and persistence invariants. Use decimal strings for financial values and preserve the precision contract in [root guidance](/AGENTS.md#financial-precision); do not test Sequelize's ordinary persistence or timestamp behavior.
- Service tests prove business operations and their persisted outcomes. Observe records through Sequelize unless the returned value is itself the application contract. Use virtual attributes such as `lines` instead of parsing stored `values`, and include record IDs when matching multiple persisted records.
- Controller tests prove authentication, policy-filtered inputs, and the HTTP response contract. Keep independent persistence outcomes in service or model scenarios rather than adding them to a response test.
- Factory setup supports these scenarios; it is not the business operation under test. Use the project's factories to arrange data instead of calling production provisioning services for setup.

Mirror the owning source path under `api/tests` with a `.test.ts` filename and describe the source file, class/model, and method in nested suites. Move or remove the suite with its owning source. Migration checks are disposable: verify migrations during implementation, then delete their test files and dedicated fixtures before committing.

## Scenario and Assertion Contracts

Keep setup local to the scenario, using explicit fixture names such as `user1` and `user2` for equivalent records. Use one `expect` per test; separate rejection, persistence, and preservation outcomes rather than bundling them. A controller HTTP response is the deliberate exception: assert `response.status` first with `toEqual(...)`, then the complete `response.body` with `toEqual(...)`. These two assertions describe one coupled response, not permission to add independent outcomes.

For a negative spy contract, use `expect(spy).not.toHaveBeenCalled()` without arguments. Time-dependent suites use `vi.useFakeTimers()` with `vi.useRealTimers()` teardown; set the clock with `vi.setSystemTime(new Date("YYYY-MM-DD"))`, leave a blank line before scenario setup, and use explicit dates relative to that clock.

## Factory and Harness Boundaries

Use [Factory Shark](https://github.com/klondikemarlen/factory-shark#readme) for Sequelize model factories in `tests/factories`. Declare scalar attributes and `belongsTo` dependencies with `associate`; the library owns building and persistence. Fishery remains appropriate for `FundingLineValue`, a plain JSON value, and frontend API response fixtures rather than Sequelize models.

Reuse persisted parents with `.associations({ parent }).create()` or pass their foreign keys to `.create({ parentId })`. Register dependent associations after their prerequisites and use lazy overrides for shared funding-period context. Derive historical snapshots from resolved associations in `beforeCreate`, preserving explicit financial values and null links. `build()` is database-free and does not load existing parents by ID. When a category's funding period depends on a fiscal period, pass the persisted fiscal period through `.associations({ fiscalPeriod })`: Factory Shark 1.1.0 resolves ID-only parents after dependent associations, too late for those lazy category defaults.

Keep Factory Shark and the ORM/dialect within the library's [qualified compatibility contract](https://github.com/klondikemarlen/factory-shark/blob/v1.1.0/docs/architecture/sequelize-compatibility.md). The [isolated test harness](/bin/README.md#api-test-commands-and-isolation) owns database cleanup; do not add competing cleanup or run concurrent containers against the same test database.
