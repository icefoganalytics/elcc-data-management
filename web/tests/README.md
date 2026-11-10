# Web Tests

Run tests from the repository root through `bin/dev`:

```bash
./bin/dev test web -- --run
./bin/dev test web -- --run tests/components/wage-enhancements/WageEnhancementsEditTable.test.ts
./bin/dev run --no-deps web npm run check-types
```

## Component Tests

Follow [Scenario-Oriented Verification in the shared Code Organization Reference](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/code-organization-reference.md#scenario-oriented-verification) for named observable contracts, visible component outcomes, and scenario-local setup. The following conventions retain ELCC's suite structure and harness:

- Component and composable suites use three nested `describe` scopes: the source file path, the component or composable name, then the method or behavior under test. Keep each `test("when ..., ...")` inside that behavior scope.
- Use explicit Arrange, Act, and Assert sections with descriptive `when ..., does ...` test names.
- Use one `expect` per test. Give independently observable outcomes separate scenarios; do not hide additional assertions in helpers or combine unrelated outcomes into a synthetic bundle.
- Reuse existing infrastructure helpers such as `mockVuetify` and the typed frontend factories in `tests/factories`. Keep scenario-specific factory overrides inline.
- Prefer API spies and real composables. Mock dependencies outside the behavior under test, not the component's own state machinery.
- ELCC request-state coverage gives errors, loading completion, returned records, authorization policy, and collection counts separate named scenarios. These are independently consumed states, even when one request changes them together.
- Give independently observable retry feedback, edited-input retention, and saved API payloads their own named scenarios.
- Assert live state at the phase the test names. Cover pending and completed requests in separate self-contained scenarios; do not capture intermediate state in variables and assert those snapshots after a later transition.
- Permanent tests cover current user behavior and invariants, not evidence that a removed feature or old implementation no longer exists. Keep current-state investigation checks disposable; for autosave, prove committed edits are saved rather than asserting the old Save control is absent.
- The Vitest configuration resets mocks between tests. Do not add redundant per-test mock resets.
- `tests/setup.ts`, loaded through Vitest's `setupFiles`, enables automatic unmounting for all mounted wrappers. Register `beforeEach` setup before `enableAutoUnmount(afterEach)` teardown. Do not register `enableAutoUnmount` in individual test files. Explicitly unmount only when unmounting is the behavior under test.
- Keep suite-specific lifecycle state and hooks inside the suite's outer `describe`. Reserve shared setup for infrastructure needed across suites; do not introduce a global fixture for locally owned resources.
- For slow-save scenarios, a local deferred promise can hold the API spy pending. Keep stale server responses separate from editable records so subsequent edits cannot mutate the response fixture.

### Mocking GET Routes

Use `mockHttpGetRoutes` from `@/tests/support` to register an explicit URL-to-callback map beside each scenario's fixtures:

```ts
const records = [recordFactory.build({ month: "April" })]
mockHttpGetRoutes({
  "/api/records": (config) => ({
    data: {
      records: config?.params?.where?.month === "April" ? records : [],
    },
  }),
  "/api/categories": () => ({ data: { categories: [] } }),
})
```

Keys match exact URLs; query parameters remain in the Axios config passed to the callback. Callbacks (including `vi.fn` spies) return the complete mocked response, such as `{ data: ... }`, or a promise of that response. Return a deferred promise for pending requests or a rejected promise for failures. Keep route-specific decisions within that route's callback.

Unmatched URLs delegate to the GET implementation already installed, preserving shared setup and authentication mocks. Register once per scenario; Vitest's configured mock reset removes these overrides between tests. The helper does not supply collection data or other scenario defaults.

## Fixture Factories

Use Fishery for repeated frontend API entities. Factories return the corresponding frontend API type and build related records through the owning factory. They must not import backend models or create persisted data. Keep one-off inputs literal; use `build({ ...overrides })` beside each scenario for meaningful values.

Re-export named factory symbols from `tests/factories/index.ts`, following [`api/tests/factories/index.ts`](../../api/tests/factories/index.ts). Do not alias default exports in the barrel.

The web test service has its own dependency mount. After changing `web/package-lock.json`, refresh source-bound web dependencies as documented in `bin/README.md` and rebuild the isolated test image with `./bin/dev build test_web`.
