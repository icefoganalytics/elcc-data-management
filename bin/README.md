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

### Database Connection Isolation

ELCC pins Local Development Gateway **0.2.2** and follows its
[private-alias contract](https://github.com/icefoganalytics/local-development-gateway/blob/v0.2.2/README.md#canonical-development-and-test-compose-pattern).
Run `bundle install` after pulling this change.

| Connection context                          | Host                          | Path                                                                     |
| ------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| API, migrations, seeds, and test containers | `${COMPOSE_PROJECT_NAME}-db`  | SQL Server on the checkout's private `default` network                   |
| Desktop SQL client                          | `db.<checkout-hostname>:1433` | Encrypted shared gateway route; trust the development server certificate |
| Explicitly selected database-local console  | `localhost`                   | Inside that checkout's `db` container                                    |

The base checkout's desktop endpoint remains `db.elcc-data-management.localhost:1433`.
Internal connections must not use bare `db`: API containers also join the shared gateway
network, where another checkout can advertise the same service name. The qualified alias
belongs only to `default`. Keep database networks in mapping form in both Compose files so
the gateway overlay preserves `default.aliases`. Do not publish a database host port.
Tests retain `elcc_test`; development retains `elcc_development`.

Inspect both configurations through the wrapper without printing credentials:

```bash
./bin/dev config --format json | jq '{api_host: .services.api.environment.DB_HOST, test_host: .services.test_api.environment.DB_HOST, test_database: .services.test_api.environment.DB_NAME, database_networks: .services.db.networks, database_ports: (.services.db.ports // [])}'
./bin/dev --file docker-compose.development.gateway.yml config --format json | jq '{api_host: .services.api.environment.DB_HOST, test_host: .services.test_api.environment.DB_HOST, database_networks: .services.db.networks, database_ports: (.services.db.ports // [])}'
```

After adoption, recreate services with `./bin/dev up -d --wait`. Wait for the API's database
initializers to finish; Compose's running state alone does not prove SQL Server readiness.
If a base-only command recreates `db`, run `./bin/dev up -d --wait` again to restore gateway
attachments. Keep existing database volumes; no reset or database replacement is needed.

Compose selects project identities using its native precedence: global `-p` / `--project-name`, then `COMPOSE_PROJECT_NAME`, then the top-level `name:`. The base Compose file supplies the existing normalized checkout name as its default, preserving current short identities and volumes. Gateway hostnames remain checkout-derived, independent of an explicit Compose project name.

The complete `${COMPOSE_PROJECT_NAME}-db` alias is one DNS label, so choose a unique project name of at most 60 lowercase letters, digits, and hyphens before creating a new stack. The wrapper does not hash or shorten names, and configuration rendering can accept an alias longer than 63 characters. The gateway gem does not enforce this budget either; see its [native selection and data-preservation guidance](https://github.com/icefoganalytics/local-development-gateway/blob/v0.2.4/README.md#private-database-alias-length). Use the same chosen identity for startup, tests, and shutdown. For example:

```bash
COMPOSE_PROJECT_NAME=elcc-141 ./bin/dev config --format json
COMPOSE_PROJECT_NAME=elcc-141 ./bin/dev up --build
COMPOSE_PROJECT_NAME=elcc-141 ./bin/dev down
```

For an existing stack, first record its current project identity and exact database volume name, take and verify a database backup, and stop services using that same identity. Selecting another project name can select a new empty volume; it does not migrate or rename existing data. Any identity change needs an explicit data-preserving migration or a local Compose override that retains the original volume through `volumes.db_data.external: true` and its recorded `volumes.db_data.name`. Keep using that override on subsequent commands. Verify the rendered volume before startup and database identity and contents afterward. Do not run `down --volumes`; retain the original volume and verified backup until recovery is no longer needed. Existing encrypted desktop routes remain unchanged.

Verify actual connection identity, not only DNS resolution:

- From both `api` and `test_api`, use the application's database clients to query
  `SELECT SERVERPROPERTY('ServerName') AS server_name, DB_NAME() AS database_name`.
  Both contexts must reach their own server, with tests selecting `elcc_test`.
- Repeat with a second isolated stack running. Stop only the owned database with
  `./bin/dev stop db`: its configured API/test connections must fail, not reach the other
  server. Restore it with `./bin/dev start db` and verify connections again.
- Run the same identity query from an encrypted desktop connection and from the explicitly
  selected local console, for example
  `./bin/dev sqlcmd-query "SELECT SERVERPROPERTY('ServerName'), DB_NAME();" -S localhost`.
  Console-only success does not verify API/test or desktop routing.

The installed bundle and active shared router can differ: inspect the router's mounted
source/version separately with `docker inspect local-gateway-database-router-1`.
Coordinate any required shared-router restart with other participating projects; do not
restart it merely because this checkout's bundle changed.

### Editor Bridge

Run `bundle install` to install `open-in-editor-bridge` 0.5.0. Before upgrading, stop any
running 0.1.x or vendored bridge using its original CLI; the protocols cannot share a port.

`dev up` and `dev down` delegate editor integration to the gem's Compose adapter. It
mounts the bundled Vite plugin and a checkout identity manifest; the application does
not export session IDs or rewrite editor requests.

Keep the development helper happy-path only, matching sibling projects: `up` and
`down` call the gem directly inside the gateway wrappers; `compose` stays plain.
Reuse the file selector and environment map. The environment builder supplies checkout
and bridge-specific values; callers do not merge the full host environment. Prepare
options and environment values in named locals before calling the gem. Do not add
lifecycle flag parsing, alternate-environment fallbacks, or compatibility dispatch.
Run `dev` from the repository root with normal Bundler setup.
The shared file selector retains existing Linux overrides when present, before the
gateway overlay.

Only adapter-backed development startup sets `OPEN_IN_EDITOR_BRIDGE_ENABLED=true`.
Ordinary commands explicitly disable it, so `dev web npm run start` does not require
editor mounts. Test and production configurations do not load the plugin.

The library owns foreground lease cleanup and detached registrations; `dev down`
releases only this checkout, preserving other active sessions. Use `dev up -d --wait`
to wait for readiness while retaining registration; the wrapper forwards flags unchanged.

The wrapper defaults `OPEN_IN_EDITOR_COMMAND` to `EDITOR`, or `devin-desktop` when unset.
The gem's Docker adapter defaults its bind address to `0.0.0.0`; the wrapper does not set it.
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
