# Project Knowledge

Durable domain and architecture knowledge for ELCC maintainers. Enrich these pages when implementation establishes or changes a project fact; do not retain completed implementation plans as reference material.

## Current scale and engineering tradeoffs

As of October 2026, the maintainer expects roughly ten people to use ELCC Data Management. This is a small operational application, not a service designed for thousands of users. Favor straightforward code, established project patterns, and low maintenance cost for this audience.

- Solve observed user needs and documented requirements. Do not add custom isolation levels, locking, retry coordination, or scaling infrastructure solely for hypothetical high-volume or concurrent usage.
- A small user base does not eliminate overlapping requests. At this stage, ordinary persistence behavior is the default; stricter same-record concurrency guarantees need a concrete workflow requirement or an observed failure that justifies their complexity.
- Preserve authorization, validation, financial precision, historical data integrity, and transactions needed to make multi-row operations atomic. These are correctness requirements even for one user, not high-scale optimizations.

Revisit these tradeoffs when the audience, workload, or evidenced operational needs change; a future increase in user count is not a requirement to implement that complexity now.

## Domain

- [Child Care Spaces](domain/child-care-spaces.md): monthly identity, historical snapshots, occupancy calculations, initialization, and worksheet/reporting rules.

## Architecture

- [Monthly worksheet persistence](architecture/monthly-worksheet-persistence.md): data ownership, separate save boundaries, historical JSON cutover, and linked regression evidence.

## Authority and placement

- Domain documentation records intended meaning and invariants; linked source records current implementation; tests and QA observations provide evidence. Record a disagreement rather than assuming documentation proves runtime behavior.
- Keep component-specific implementation guidance in nearby READMEs. Keep developer and agent procedures in [agents/workflows](../agents/workflows/README.md), not domain pages.
- Plans are temporary working material. After implementation, preserve useful facts, decisions, edge cases, and validated examples in their owning knowledge pages or source-adjacent READMEs, then remove the plan. Discard stale analysis and task checklists rather than renaming them as documentation.

This is repository documentation, not a published documentation site. Repository visibility controls access; a future site needs an explicit publication allowlist, and confidential material must not be committed to a public repository.
