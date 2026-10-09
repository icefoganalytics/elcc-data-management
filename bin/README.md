# Top-Level Bin Directory

## `dev` Command

The `dev` command is the main development helper for this repository. It wraps docker compose with project-specific shortcuts.

Common usage:

```bash
dev up --build              # Boot application (--build on first run or after Dockerfile changes)
dev down                    # Stop application
dev logs                    # View logs
dev sh                      # Access shell in API container

dev test_api                                    # Run all backend tests
dev test_web                                    # Run all frontend tests
dev test api -- --run tests/models/fiscal-period.test.ts  # Run single backend test file
dev test web -- --run src/components/SomeComponent.test.ts # Run single frontend test file

dev web npm run check-types         # Check frontend types
dev api npm run check-types         # Check backend types
dev run --no-deps web npm run clean # Remove frontend build output only

dev migrate latest                 # Run all pending Knex migrations
dev migrate make add-users-status   # Create a new Knex migration
dev migrate list                    # List Knex migration state
dev migrate list -- --env test      # Forward Knex options after npm's -- separator

dev api npm run knex -- seed:make fill-users-table  # Create an environment-specific seed
dev seed                                           # Run environment-specific seeds

dev api npm install lodash  # Run npm in API container
dev web npm install vue     # Run npm in web container
```

`dev up` starts or reuses the shared local gateway. The base checkout is available at
http://elcc-data-management.localhost; named worktrees receive their own
`<worktree>.elcc-data-management.localhost` hostname.

Once Vite starts, the web service prints `Open ELCC: http://<hostname>/` with that checkout's
gateway hostname.

### Editor Bridge

Run `bundle install` to install `open-in-editor-bridge` 0.2.0. Before upgrading, stop any
running 0.1.x or vendored bridge using its original CLI; the protocols cannot share a port.

`dev up` registers this checkout with the shared editor bridge. The wrapper passes its
session ID into the web container, and Vite adds `session=<checkout-id>` to editor requests.
The session ID selects the checkout; it is not an authentication token.
Compose commands do not require this ID; without it, Vite omits the session parameter.

`dev up` releases its editor lease when Compose returns. Use foreground startup for
editor links; detached startup does not retain a session. Releasing one checkout's
lease does not release another checkout's session.

The wrapper defaults `OPEN_IN_EDITOR_COMMAND` to `EDITOR`, or `devin-desktop` when unset.
It defaults `OPEN_IN_EDITOR_BRIDGE_BIND_ADDRESS` to `0.0.0.0` for Docker access.
Editor requests are unauthenticated: use only a trusted development network with host
firewall restrictions, never public port forwarding. Set the bind address to a specific
Docker-reachable host interface to narrow exposure. The development proxy uses port `3333`.
All clients sharing the listener must agree on bind address and runtime directory.

See the [released bridge documentation](https://github.com/klondikemarlen/open-in-editor-bridge)
for direct CLI use and shared-runtime configuration.

### Dependencies and SQL Scripts

In each new checkout, initialize the ignored source-bound dependencies before the first `dev up`:

```bash
dev api npm clean-install
dev web npm clean-install
```

Repeat the affected service's install command when its `package-lock.json` changes after pulling
or switching branches. The source bind mount includes the host `node_modules` directory, so
`dev up --build` does not refresh those dependencies.

If a missing package prevents API startup, refresh the installation without starting dependent services:

```bash
./bin/dev run --no-deps api npm clean-install
```

For frontend dependency changes, use `web` instead of `api`.

For example, you can run a sql script via

```bash
dev sqlcmd -i ./data/funding_submission_lines.sql
```

assuming the file is located at `/db/data/funding_submission_lines.sql`

Note that the `dev` command uses the `db` service, and so only has access to folders under the top-level `db` directory.
