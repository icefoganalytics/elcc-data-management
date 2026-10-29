# ELCC Testing Instructions

Shared base: `skill://testing-instructions/workflow.md` from MSSRT. Load it directly, then apply this overlay under [root authority](/AGENTS.md#shared-standards-and-local-authority). The shared owner maintains scenario design, evidence ownership, exact-label verification, and authenticated-preflight principles.

Write the existing **Testing Instructions** section of [the PR template](/.github/pull_request_template.md); do not add a second description or operational QA report.

## Project Setup and Commands

[bin guidance](/bin/README.md) owns executable commands, test images, database isolation, and concurrency. [API tests](/api/tests/README.md) and [web tests](/web/tests/README.md) own their harness details. Run the [development wrapper](/bin/dev) from the repository root; `dev` is only a shortcut when direnv has added it to PATH.

For an application scenario, include the relevant test command, startup with `./bin/dev up --build`, and login at the checkout's gateway URL before the first action requiring the app. The base checkout uses http://elcc-data-management.localhost; named worktrees have their own hostnames, as documented in bin guidance. Auth0 must allow that origin; do not bypass login or infer authenticated coverage from mocks. Choose the affected API/web tests and type checks rather than prescribing an unrelated full suite.

For documentation-only work, replace the template's application setup examples with the relevant source/link audit and a representative consumption exercise. No application boot or login proves a documentation-discovery change.

## Application Capture Prerequisites

Use the [PR screenshot policy](pull-request-management.md#screenshots) and its shared capture/upload procedure. Reach the checkout's gateway URL through real Auth0 login with an authorized account and the role/data needed for the target route. For worksheets, select the intended centre, funding period, fiscal year, and month; for administration, confirm the required role. An Auth0 redirect or a missing record blocks the application capture, not GitHub attachment authentication.

For automated Firefox QA, follow `skill://browser-qa/workflow.md` and its installed-control discovery and owned-profile procedures; ELCC does not supply a separate Firefox driver or automation endpoint. A request merely to open the app for user-led review uses ordinary Firefox and is not capture evidence. Existing-personal-session reuse requires an explicit request and supported control/capture; otherwise name the missing user action or seek an authorized alternative without switching engines, restarting the personal browser, or copying profiles/cookies.

## ELCC Scenario Context and Formatting

- Identify the centre, funding period, fiscal year, and month when a worksheet scenario depends on them. Include user-role requirements for administration actions and verify past-period history remains unchanged when that is the invariant under test.
- Verify current navigation, button, tab, and field labels in the owning Vue components and routes. Historical building-expense or information-sharing examples are not a UI contract.
- Use bold for UI elements, inline code for exact values/URLs/errors, and arrows for navigation paths. For complex flows, use `## Test Case N: Description` and continue step numbering across cases.
- When the scenario changes financial data, use string amounts and the precision rules in [root guidance](/AGENTS.md#financial-precision).

When screenshot work is requested, verify the [application capture prerequisites](#application-capture-prerequisites) separately from the shared procedure's GitHub sign-in and upload checks.
