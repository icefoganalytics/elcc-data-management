# ELCC Testing Instructions

Shared base: `skill://testing-instructions/workflow.md` from MSSRT. Load it directly, then apply this overlay under [root authority](/AGENTS.md#shared-standards-and-local-authority). The shared owner maintains scenario design, evidence ownership, exact-label verification, and authenticated-preflight principles.

Write the existing **Testing Instructions** section of [the PR template](/.github/pull_request_template.md); do not add a second description or operational QA report.

## Project Setup and Commands

[bin guidance](/bin/README.md) owns executable commands, test images, database isolation, and concurrency. [API tests](/api/tests/README.md) and [web tests](/web/tests/README.md) own their harness details. Run the [development wrapper](/bin/dev) from the repository root; `dev` is only a shortcut when direnv has added it to PATH.

For an application scenario, include the relevant test command, startup with `./bin/dev up --build`, and login at the checkout's gateway URL before the first action requiring the app. The base checkout uses http://elcc-data-management.localhost; named worktrees have their own hostnames, as documented in bin guidance. Auth0 must allow that origin; do not bypass login or infer authenticated coverage from mocks. Choose the affected API/web tests and type checks rather than prescribing an unrelated full suite.

For documentation-only work, replace the template's application setup examples with the relevant source/link audit and a representative consumption exercise. No application boot or login proves a documentation-discovery change.

## ELCC Scenario Context and Formatting

- Identify the centre, funding period, fiscal year, and month when a worksheet scenario depends on them. Include user-role requirements for administration actions and verify past-period history remains unchanged when that is the invariant under test.
- Verify current navigation, button, tab, and field labels in the owning Vue components and routes. Historical building-expense or information-sharing examples are not a UI contract.
- Use bold for UI elements, inline code for exact values/URLs/errors, and arrows for navigation paths. For complex flows, use `## Test Case N: Description` and continue step numbering across cases.
- When the scenario changes financial data, use string amounts and the precision rules in [root guidance](/AGENTS.md#financial-precision).

Screenshot discovery remains [#136](https://github.com/icefoganalytics/elcc-data-management/issues/136); do not treat a placeholder as uploaded or authenticated evidence.
