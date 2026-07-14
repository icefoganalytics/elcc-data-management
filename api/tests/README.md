# API service Tests

## Testing Commands

**IMPORTANT:** Use `bin/dev` from the repository root (or `dev` when direnv is active) when running commands directly.

- **Run all API tests**: `bin/dev test api -- --run`
- **Run specific test file**: `bin/dev test api -- --run tests/services/example.test.ts`
- **Run tests with watch mode**: `bin/dev test api tests/services/example.test.ts` (no `--run` flag)
- **Run tests with pattern**: `bin/dev test api -- --grep "fiscal year"`
- **Skip setup (faster)**: `bin/dev test api --skip-setup -- --run tests/services/example.test.ts`
- **Format files**: from the repo root run `npx prettier --write <paths>`

**Why `bin/dev` from the repository root instead of `dev`:**

- The `.envrc` file adds `bin` to PATH with `PATH_add bin`
- This makes `dev` available when direnv is active in the shell
- When running commands through tools or in different contexts, direnv may not be active
- Using `bin/dev` ensures the command is always found regardless of direnv state
- **Best practice**: Always use `bin/dev` from the repository root in scripts and tool calls for reliability

## Skipping Global Setup (Quick Mode)

Global setup runs database health checks, migrations, and seeds on every test invocation. When these have already run in the current session (i.e., the database is initialized and migrations are current), you can skip them for faster iteration:

```bash
# ~5s instead of ~14s
bin/dev test api --skip-setup -- --run tests/services/example.test.ts
```

**When to use:** After you've already run tests at least once in the current session (so the database exists, migrations are applied, and seeds are loaded).

**When NOT to use:** After pulling new code with migrations, after a database reset, or on the first test run of a session. If tests fail unexpectedly with quick mode, re-run without it to ensure the database is fully initialized.

## Sharing the Test Container (AI Agents)

**Only one test container can run at a time** — running two causes database deadlocks. When the user already has a test container running (e.g., in watch mode), AI agents must not start their own via `dev test`. Instead, watch the existing container's output:

```bash
# User runs this in one terminal
bin/dev test api tests/services/example.test.ts

# AI agent watches the existing container output
docker logs -f elcc-data-management-test-1
```

## Implementation

Tests are written in [vitest](https://vitest.dev/guide/)

Test initialization goes like this:

1. `api/vitest.config.mts` loads the ts config and finds the appropriate setup functions.

2. Before running the tests, it runs the `globalSetup` function from `api/tests/global-setup.ts`. Things like setting up the database and running migrations and base seeds.

3. Next it loads a specific test file triggers the `setupFiles` files, currently only `api/tests/setup.ts`. These setup files add callbacks that will run before/after _each test file_ runs, so they should be performant. Mostly cleanup functions.

4. It runs the actual tests in the loaded file.

5. (Currently) Runs `beforeEach` callback that cleans the database before each test file is run.

6. Runs the next test file, and repeats from step 3.

## General Testing Guidelines

1. Tests should map to a specific file in the api/src folder.

   e.g.

   - `api/src/models/funding-submission-line-json.ts` maps to `api/tests/models/funding-submission-line-json.test.ts`
   - `api/src/services/centre-services.ts` maps to `api/tests/services/centre-services.test.ts`

2. Tests should follow the naming convention `{filename}.test.{extension}`.
3. Test file location should be moved if a given file is moved, and deleted if the file under test is deleted.
4. A good general pattern for a test is
   ```typescript
   describe("api/src/services/centre-services.ts", () => { // references file under test
     describe("CentreServices", () => { // references class or model under test
       describe(".create", () => { // referneces a specific method on the class or model
       test("creates a new centre in the database", async () => { // descriptive message about the specific behaviour under test
       })
     })
   })
   ```
5. In isolated model or scope tests, avoid redundant `where` clauses that only restate the records created in the test. Only include extra filters when that filter is part of the behavior under test.
6. Prefer one `expect(...)` per test. If you need to verify multiple outcomes, split them into separate tests with narrow assertions.
7. Prefer concrete record assertions over count-only assertions. When asserting persisted results, prefer `findAll()` on the full table and compare the returned records directly. Do not add restrictive `where` clauses or `order` clauses unless that filter or ordering is part of the behavior under test.
8. Use full, descriptive variable names in tests. Avoid abbreviations like `persistedCategory` when `persistedBuildingExpenseCategory` is clearer.
9. Order test imports by conceptual distance: third-party libraries first, then local project imports such as models, then factories, and finally the file under test.

## Expect Matching Patterns

- Use `await expect(model.reload()).resolves.toEqual(...)` pattern for asserting on reloaded models instead of separate reload and expect calls
- Use `expect.objectContaining({ lines: [...] })` for nested object matching instead of accessing properties directly
- Use direct array matching `[...]` instead of `expect.arrayContaining([...])` when the exact array size is known
- Use virtual attributes in tests instead of manual JSON parsing/stringifying (e.g., `lines` instead of `JSON.parse(values)`)
- When asserting on multiple records, use `Model.findAll()` and match specific records by including their `id` in `expect.objectContaining` to ensure correct record matching regardless of order
- Pattern: `const records = await Model.findAll(); expect(records).toEqual([expect.objectContaining({ id: record1.id, ... }), expect.objectContaining({ id: record2.id, ... })])`

## Time Freezing Patterns

- Use `vi.useFakeTimers()` in `beforeEach()` and `vi.useRealTimers()` in `afterEach()` for time-dependent tests
- Use `vi.setSystemTime(new Date("YYYY-MM-DD"))` to set a frozen time at the start of each test
- Use hardcoded dates relative to the frozen time (e.g., `"2025-04-15"` for future, `"2025-03-15"` for past) instead of dynamic date calculations
- Add blank line after `vi.setSystemTime` before test setup
- Pattern ensures tests are deterministic and don't fail when run at different times

## Test Description Patterns

- Use `"when [condition], and [condition], [expected outcome]"` format for test descriptions
- Use `"when [condition], and [condition], but [condition], [expected outcome]"` for negative cases
- Example: `"when provided with a centre with hot meal enabled, and Quality Enhancement Program sections exist in a future funding submission line json, applies enhancement"`
- Example: `"when provided with a centre, and future funding submission lines exist but are not Quality Enhancement Program sections, does not apply enhancement"`
- Example: `"when multiple lines exist including Quality Enhancement Program sections and non-Quality Enhancement Program sections, only applies enhancement to Quality Enhancement Program sections"`
- Avoid vague descriptions like `"when provided with a centre, does not apply enhancement to non-Quality Enhancement Program sections"`
- Prefer positive phrasing like `"only applies enhancement to XYZ"` over `"applies enhancement only to XYZ"` to avoid negatives

## VS Code Plugin Configuration

The following VS Code plugin is used to switch between test and non-test files and create test files if they do not exist: https://marketplace.visualstudio.com/items?itemName=klondikemarlen.create-test-file

It requires this config (in your workspace or `.vscode/settings.json`):

> Note: if this is in your workspace config, it must be inside the "settings" entry. i.e. `{ "settings": { // these settings } }`.

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
