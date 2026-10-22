# Web Tests

Run tests from the repository root through `bin/dev`:

```bash
./bin/dev test web -- --run
./bin/dev test web -- --run tests/components/wage-enhancements/WageEnhancementsEditTable.test.ts
./bin/dev run --no-deps web npm run check-types
```

## Component Tests

- Component and composable suites use three nested `describe` scopes: the source file path, the component or composable name, then the method or behavior under test. Keep each `test("when ..., ...")` inside that behavior scope.
- Use explicit Arrange, Act, and Assert sections with descriptive `when ..., does ...` test names.
- Keep scenario data, API responses, and `mount(...)` options inside each test. Intentional duplication is preferable to local mount helpers, response builders, or shared scenario fixtures.
- Reuse existing infrastructure helpers such as `mockVuetify` and the typed frontend factories in `tests/factories`. Keep scenario-specific overrides inline.
- Prefer API spies and real composables. Mock dependencies outside the behavior under test, not the component's own state machinery.
- Keep one observable contract per test and assert it directly. Separate API-payload expectations from independent rendered-output checks; mock-call assertions belong in their own focused scenarios. Related loading, error, and stale-data assertions may stay together when they prove one lifecycle invariant. Do not construct summary objects to force one assertion or assert incidental wording.
- Permanent tests cover current user behavior and invariants, not evidence that a removed feature or old implementation no longer exists. Keep current-state investigation checks disposable; for autosave, prove committed edits are saved rather than asserting the old Save control is absent.
- The Vitest configuration resets mocks between tests. Do not add redundant per-test mock resets.
- `tests/setup.ts`, loaded through Vitest's `setupFiles`, enables automatic unmounting for all mounted wrappers. Do not register `enableAutoUnmount` in individual test files. Explicitly unmount only when unmounting is the behavior under test.
- For slow-save scenarios, a local deferred promise can hold the API spy pending. Keep stale server responses separate from editable records so subsequent edits cannot mutate the response fixture.

These conventions follow [WRAP's component-test guidance](https://github.com/icefoganalytics/wrap/blob/80066b23b3aa0302589847eba7b790c705c748e6/web/tests/README.md#test-style), adapted to this repository's test setup and dependencies.

## Fixture Factories

Use Fishery for repeated frontend API entities. Factories return the corresponding frontend API type and build related records through the owning factory. They must not import backend models or create persisted data. Keep one-off inputs literal; use `build({ ...overrides })` beside each scenario for meaningful values.

Re-export named factory symbols from `tests/factories/index.ts`, following [`api/tests/factories/index.ts`](../../api/tests/factories/index.ts). Do not alias default exports in the barrel.

The web test service has its own dependency mount. After changing `web/package-lock.json`, refresh source-bound web dependencies as documented in `bin/README.md` and rebuild the isolated test image with `./bin/dev build test_web`.
