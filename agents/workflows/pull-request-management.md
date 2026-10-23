# ELCC Pull Request Conventions

Shared base: `skill://pull-request-management/workflow.md` from MSSRT. Read it directly before this overlay; [root guidance](/AGENTS.md#shared-standards-and-local-authority) defines source resolution and local precedence. Generic draft publication, metadata, review, feedback resolution, evidence placement, and merge procedures belong to that base.

## Local Description Contract

Use [the canonical PR template](/.github/pull_request_template.md), preserving its section order rather than copying another skeleton here.

- Titles use AP title case: `Issue-<number>: Description` for a real GitHub issue or `ELCC-<number>: Description` for a real Jira ticket. For untracked work use an outcome-focused title without an invented ticket prefix.
- Jira-backed work links the authoritative Jira ticket by its exact key and URL under [ticket context](jira-issue-management.md#tracker-and-project-boundary). Do not create a GitHub issue to satisfy branch or PR creation; a secondary tracker requires an explicit owner request or documented project requirement.
- Use `Fixes <GitHub issue URL>` only for the delivery that closes a real GitHub issue; use `Part of <issue URL>` for a partial delivery. For Jira, use a key-plus-URL reference without GitHub closing keywords; keep lifecycle updates in Jira.
- Keep **Implementation** a numbered list grouped by architectural concern. Describe what maintainers/users gain, not a file-by-file tour; naming files is appropriate when documentation itself is the changed surface.
- Keep review, QA, learner triage, source-version adoption evidence, and delivery status in the existing permitted task/session evidence unless an explicit maintainer instruction selects another location. Do not append routine report comments or extra template headings.
- Generate **Testing Instructions** with [the ELCC testing overlay](testing-instructions.md); canonical commands and gateway hostnames belong to [bin guidance](/bin/README.md), not old localhost examples.

## Screenshots

For UI component/page behavior changes, retain the existing project handoff: use `TODO` for the user to add screenshots. Use `N/A` with the actual reason when no UI behavior changes, including documentation-only PRs. Screenshot routing, capture/login prerequisites, and replacing this human-only handoff are separately owned by [#136](https://github.com/icefoganalytics/elcc-data-management/issues/136); this cutover does not implement or verify capture/upload.

## Local Verification Sources

Use [review constraints](code-review.md), [API tests](/api/tests/README.md), [web tests](/web/tests/README.md), and [COMMITTING](/COMMITTING.md). Preserve current Auth0 login and centre/funding-period/fiscal-year/month context when a scenario needs application data. UI labels and route availability must come from the current Vue source, not historical examples.
