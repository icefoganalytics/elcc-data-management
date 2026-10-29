# Agent Guidance Discovery

Start at [root guidance](/AGENTS.md#shared-standards-and-local-authority). Load the relevant direct MSSRT source before applying ELCC's local constraints; do not call the selecting skill from a local overlay.

## Find the Current Local Material

Read the actual contents of the relevant directory rather than relying on a copied agent or workflow catalog:

- [Workflows](workflows/): ELCC overlays and the local admin UI recipe. [Workflow entry guidance](workflows/README.md) explains how to consume them.
- [Templates](templates/): project-specific examples; consult the directory and nearby live source before using an example.
- [Plans](plans/README.md): temporary implementation planning, not completed domain documentation.
- [Project knowledge](/docs/README.md): durable domain and architecture facts.
- Source-adjacent READMEs linked from root guidance: layer responsibilities, API contracts, security, and runnable development/test instructions.

These are ordinary repository files. No setup script, hardlinks, client-specific workflow directory, generated catalog, or frontmatter installation is required. A client's own skill discovery is separate from these local extensions; reference an ELCC file directly when the client does not select it automatically.

Before removing copied coverage, resolve the corresponding source in the selected available MSSRT release. Keep observed version identity and consumption evidence in the owning task/PR/session. Missing sources, selection cycles, or genuine local/shared conflicts block the affected cutover; preserve local precedence until resolved.

Reusable Vue/async or general authoring proposals belong to the shared owner. Screen editing, queues, undo decisions, and funding policy remain ELCC-owned; a proposed shared issue does not activate a new application requirement. Executable rails and tooling require separate compatibility proof. For screenshot work, follow the [local PR policy](workflows/pull-request-management.md#screenshots) and its shared capture/upload route.
