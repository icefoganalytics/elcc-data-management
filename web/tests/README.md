# Web Tests

Run tests from the repository root through `bin/dev`:

```bash
./bin/dev test web -- --run
./bin/dev test web -- --run tests/components/WageEnhancementTierTableBody.test.ts
./bin/dev run --no-deps web npm run check-types
```

## Component Tests

- Mirror the source path in the test's outer `describe`, then name the component and behavior.
- Use explicit Arrange, Act, and Assert sections with descriptive `when ..., does ...` test names.
- Keep scenario data, API responses, and `mount(...)` options inside each test. Intentional duplication is preferable to local mount helpers, response builders, or shared scenario fixtures.
- Reuse existing infrastructure helpers such as `mockVuetify`. Use established factories where available; do not introduce a factory library solely to replace a few literal records.
- Prefer API spies and real composables. Mock dependencies outside the behavior under test, not the component's own state machinery.
- Assert directly on rendered controls, public child events, and API interactions that prove the behavior. Do not construct summary objects to force one assertion; related facts may use separate direct expectations in one final Assert section.
- The Vitest configuration resets mocks between tests. Do not add redundant per-test mock resets.
- Use `enableAutoUnmount(afterEach)` for mounted wrappers. Explicitly unmount only when unmounting is the behavior under test.
- For slow-save scenarios, a local deferred promise can hold the API spy pending. Keep stale server responses separate from editable records so subsequent edits cannot mutate the response fixture.

These conventions follow [WRAP's component-test guidance](https://github.com/icefoganalytics/wrap/blob/80066b23b3aa0302589847eba7b790c705c748e6/web/tests/README.md#test-style), adapted to this repository's test setup and dependencies.
