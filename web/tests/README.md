# Web Tests

Run tests from the repository root through `bin/dev`:

```bash
./bin/dev test web -- --run
./bin/dev test web -- --run tests/components/wage-enhancements/WageEnhancementsEditTable.test.ts
./bin/dev run --no-deps web npm run check-types
```

## Component Tests

- Mirror the source path in the test's outer `describe`, then name the component and behavior.
- Use explicit Arrange, Act, and Assert sections with descriptive `when ..., does ...` test names.
- Keep scenario data, API responses, and `mount(...)` options inside each test. Intentional duplication is preferable to local mount helpers, response builders, or shared scenario fixtures.
- Reuse existing infrastructure helpers such as `mockVuetify` and the typed frontend factories in `tests/factories`. Keep scenario-specific overrides inline.
- Prefer API spies and real composables. Mock dependencies outside the behavior under test, not the component's own state machinery.
- Assert directly on rendered controls, public child events, and API interactions that prove the behavior. Do not construct summary objects to force one assertion; related facts may use separate direct expectations in one final Assert section.
- The Vitest configuration resets mocks between tests. Do not add redundant per-test mock resets.
- Use `enableAutoUnmount(afterEach)` for mounted wrappers. Explicitly unmount only when unmounting is the behavior under test.
- For slow-save scenarios, a local deferred promise can hold the API spy pending. Keep stale server responses separate from editable records so subsequent edits cannot mutate the response fixture.

These conventions follow [WRAP's component-test guidance](https://github.com/icefoganalytics/wrap/blob/80066b23b3aa0302589847eba7b790c705c748e6/web/tests/README.md#test-style), adapted to this repository's test setup and dependencies.

## Fixture Factories

Use Fishery for repeated frontend API entities. Factories return the corresponding frontend API type and build related records through the owning factory. They must not import backend models or create persisted data. Keep one-off inputs literal; use `build({ ...overrides })` beside each scenario for meaningful values.

The web test service has its own dependency mount. After changing `web/package-lock.json`, refresh source-bound web dependencies as documented in `bin/README.md` and rebuild the isolated test image with `./bin/dev build test_web`.
