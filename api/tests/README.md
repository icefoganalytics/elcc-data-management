# API Tests

Use the [Code Review Workflow](skill://code-review/workflow.md), its [Scenario-Oriented Verification reference](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/code-organization-reference.md#scenario-oriented-verification), and the shared [Test Alignment Baseline](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/test-alignment-verifier-reference.md#shared-baseline) for shared test design. Use the [Factory Trait Workflow](skill://test-factory-traits-and-service-shape/workflow.md) for persisted fixture setup. This README records ELCC's runnable test harness and local assertion conventions.

## Running tests

Run API tests through `bin/dev` from the repository root so they use the isolated API test container and database described in [bin guidance](/bin/README.md#database-connection-isolation):

- All API tests: `bin/dev test api -- --run`
- One test file: `bin/dev test api -- --run tests/services/example.test.ts`
- Watch one test file: `bin/dev test api tests/services/example.test.ts`
- Match test names: `bin/dev test api -- --run -t "fiscal year"`
- Skip global setup after it has already completed for the current test database:
  `bin/dev test api --skip-setup -- --run tests/services/example.test.ts`

`--skip-setup` sets `VITEST_SKIP_GLOBAL_SETUP=true`; do not use it on first run, after a database reset, or when migrations or seeds have changed. The normal global setup runs the API initializers. The test setup cleans the database before each test, and the configured Vitest fork pool runs tests in a single fork. Do not run concurrent API test containers against the shared test database; they can deadlock. If a test container is already running, observe that container instead of starting another.

Vitest configuration is in `api/vite.config.mts`: it loads `tests/global-setup.ts` and `tests/setup.ts`, resolves the API and test TypeScript configurations, and enables mock and global cleanup. The test TypeScript check is `bin/dev check-types` (or `bin/dev api npm run check-types`).

## Local Suite and ORM Conventions

- Mirror the source path under `api/tests` with a `.test.ts` filename. Describe the source file, class/model, and method in nested suites; move or remove its tests with the owning source.
- Keep scenario fixture names explicit; number equivalent records as `user1`, `user2` rather than naming them for incidental creation order.
- Observe service persistence through Sequelize records unless the return value is itself the contract. Use virtual attributes such as `lines`, not manual parsing of the stored `values`; include record IDs when matching multiple persisted records.
- For a negative spy contract, use `expect(spy).not.toHaveBeenCalled()` without arguments, not `not.toHaveBeenCalledWith(...)`.
- Time-dependent suites use `vi.useFakeTimers()` with `vi.useRealTimers()` teardown. Set the clock with `vi.setSystemTime(new Date("YYYY-MM-DD"))`, leave a blank line before scenario setup, and use explicit dates relative to that fixed clock.

## Local HTTP assertion convention

For an HTTP response, assert `response.status` first with `toEqual(...)`, then assert the complete `response.body` with `toEqual(...)`. These two direct assertions describe one coupled HTTP result; keep independent persistence outcomes in separate tests. This is the established ELCC exception where a suitable HTTP response matcher is not in use, consistent with the shared review workflow.

## VS Code test-file configuration

The [Create Test File extension](https://marketplace.visualstudio.com/items?itemName=klondikemarlen.create-test-file) uses this configuration in workspace settings or `.vscode/settings.json`. When stored in workspace configuration, put these values inside its `"settings"` object.

```json
{
  "createTestFile.nameTemplate": "{filename}.test.{extension}",
  "createTestFile.languages": {
    "[vue]": {
      "createTestFile.nameTemplate": "{filename}.test.{extension}.ts"
    }
  },
  "createTestFile.pathMaps": [
    {
      "pathPattern": "(api)/src/?(.*)",
      "testFilePathPattern": "$1/tests/$2"
    },
    {
      "pathPattern": "(web)/src/?(.*)",
      "testFilePathPattern": "$1/tests/$2"
    }
  ],
  "createTestFile.isTestFileMatchers": [
    "^(?:test|spec)s?/",
    "/(?:test|spec)s?/",
    "/?(?:test|spec)s?_",
    "/?_(?:test|spec)s?",
    "/?\\.(?:test|spec)s?",
    "/?(?:test|spec)s?\\."
  ]
}
```
