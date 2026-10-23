# ELCC Workflow Extensions

Use the task-specific shared base declared in [root guidance](/AGENTS.md#shared-standards-and-local-authority), then read the relevant local file in this directory. Read the directory contents to discover current extensions; this index is not a second workflow inventory.

Local files hold ELCC constraints and recipes, not copies of the generic shared workflow. Their filenames are direct-reference entrypoints and need not match a client's skill-selector filename. Do not invoke a selecting skill from its own overlay or assume the client automatically discovers these files.

Use the authoritative ticket's tracker; Jira is not a prerequisite for a GitHub-native issue. Publish the initial draft under the shared delivery workflow, then complete review and targeted verification before readiness/merge. The canonical PR section contract lives in [the PR template](/.github/pull_request_template.md); command and database ownership stay in [bin guidance](/bin/README.md) and the test-directory READMEs.

For other local material and the missing-source/conflict policy, see [agent discovery](../README.md).
