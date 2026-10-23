# ELCC Ticket Context

Shared base: `skill://jira-reporting/workflow.md` from MSSRT, only when Jira is the authoritative tracker. Load it directly before this overlay under [root authority](/AGENTS.md#shared-standards-and-local-authority). Generic report structure, evidence preservation, relationships, and tracker lifecycle belong to the shared workflows.

## Tracker and Project Boundary

ELCC Jira tickets use `ELCC-<number>` at https://yg-hpw.atlassian.net/browse/ELCC-82 (an existing example, not the default ticket). Resolve the supplied ticket and its actual project metadata before choosing fields or transitions. The former TK board, cultural-protocol labels, and knowledge-entry examples belong to another project and are not ELCC routing instructions.

For work started from a verified Jira ticket, keep that ticket authoritative for requirements, assignment, and status. Use its exact `ELCC-<number>` key and URL in branch/PR references under [PR conventions](pull-request-management.md). A GitHub issue is not a prerequisite for the feature workflow, branch creation, or PR creation. Create a secondary tracker record only when the owner explicitly requests one or documented project policy requires it; ELCC does not require a GitHub mirror by default.

A GitHub issue supplied for work stays GitHub-native unless the owner explicitly requests a second tracker. Do not make Jira creation a prerequisite for review or PR creation. For a Jira report without a supplied ticket, verify the ELCC project, live issue types, labels, components, intended assignee, and available transitions before writing. Missing access/metadata blocks the affected tracker action; do not invent a board or reuse another project's field values.

## Local Context to Preserve

- Building expenses: expense category, funding region, fiscal period, centre, and applicable subsidy rates.
- Monthly worksheets: centre, funding period, fiscal year/month, and the affected benefit, wage, or child-care-space records.
- Administration: acting user role, permission boundary, funding-region/period scope, and historical-period integrity.
- User reports: retain useful source wording and real source links while protecting personal and financial information. Do not publish reporter emails by default.

Use AP title case with the real ticket key in linked PR titles. Follow [PR conventions](pull-request-management.md) and [testing instructions](testing-instructions.md) for the implementation handoff; report drafting alone does not start implementation.
