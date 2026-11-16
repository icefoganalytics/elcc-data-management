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

### Linting

Run `./bin/dev lint api` or `./bin/dev lint web` to check the owning package with its existing ESLint configuration. With no service argument, `./bin/dev lint` selects the API. API covers JavaScript and TypeScript; web also covers Vue. Both commands use disposable, non-interactive containers with `--no-deps` and `--no-fix`, without starting application/database services or the gateway.

Prepare the development images, local environment file, and bind-mounted dependencies using the [development setup](/README.md#development) and [dependency instructions](#dependencies-and-sql-scripts). Additional arguments are forwarded to the package's lint script; its full-project scope, ignores, rules, and warning policy remain unchanged.

API and web own separate `.omp-verifier.json` bindings to these entrypoints. OMP Verifier runs the same commands from the declaring package rather than guessing Docker arguments or linting on the host. Missing prerequisites remain `BLOCKED`; real lint violations are `FAIL`, not a wrapper-configuration blocker. A binding does not mean the source is lint-clean. Run the scopes separately when diagnosing the verifier's bounded execution time.

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

#### Choosing a Project Identity for Long Checkout Names

The private `${COMPOSE_PROJECT_NAME}-db` alias must fit in one 63-character DNS label, leaving **60 characters** for the project name. Choose a unique short identity before creating a new stack from a longer checkout:

```bash
export COMPOSE_PROJECT_NAME=elcc-141-example
./bin/dev up --build
./bin/dev test_api
./bin/dev down
```

Keep the same exported identity for every command, including migrations, logs, and teardown. The wrapper honors exported `COMPOSE_PROJECT_NAME`, falling back to the existing normalized checkout name only when it is unset. Compose's global `-p` / `--project-name` option takes precedence, for example `./bin/dev --project-name elcc-141-example config --format json`. Put global options before the Compose command; this forwards directly to Compose rather than invoking the wrapper's `up` gateway/editor integration. Prefer the exported variable for normal wrapper commands. Gateway hostnames still come from the checkout name, not the explicit project identity.

For an existing stack, retain its original project identity: choosing another name selects different project-scoped volumes and can make existing data appear missing. Before deliberately changing identity, record the original project and volume names and select and verify a data-preserving migration or explicit mapping to the original volumes. Do not remove the original volumes or assume a rename moves their data.

Use the configuration commands above to inspect matching API/test hosts and private database aliases in both base and gateway configurations; also inspect `name` and `volumes.db_data.name` before starting services. A 60-character project produces a 63-character alias; a 61-character project can still render a 64-character alias. Rendering is not DNS or connectivity proof: use the application/test identity queries above from disposable consumers to verify the intended server and database.

The gateway's [0.2.4 DNS-budget guidance](https://github.com/icefoganalytics/local-development-gateway/blob/v0.2.4/README.md#private-database-alias-length) documents this operator responsibility; it does not validate or shorten consumer aliases. No gateway upgrade or shared-router restart is needed. The wrapper likewise does not hash, shorten, or validate project-name length.

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

## API Test Commands and Isolation

Run tests through `bin/dev` from the repository root. The wrapper selects the isolated API test container and database; see [Database Connection Isolation](#database-connection-isolation).

```bash
bin/dev test api -- --run
bin/dev test api -- --run tests/services/funding-periods/create-service.test.ts
bin/dev test api tests/services/funding-periods/create-service.test.ts
bin/dev test api -- --run -t "fiscal year"
bin/dev test api --skip-setup -- --run tests/services/funding-periods/create-service.test.ts
bin/dev check-types
```

The commands run the complete API suite, one file, one file in watch mode, matching test names, one file without global setup, and the test-inclusive API typecheck, respectively.

`--skip-setup` sets `VITEST_SKIP_GLOBAL_SETUP=true`; use it only after global setup has completed for the current test database. Do not skip setup on the first run, after a database reset, or when migrations or seeds have changed. Normal global setup runs the API initializers.

The test setup cleans the database before each test, and the configured Vitest fork pool runs tests in a single fork. Do not run concurrent API test containers against the same test database; they can deadlock. Observe an existing test container instead of starting another.

[Vitest configuration](/api/vite.config.mts) loads [global setup](/api/tests/global-setup.ts) and [per-test setup](/api/tests/setup.ts), resolves the API and test TypeScript configurations, and enables mock and global cleanup. After factory dependency changes, follow [Dependencies and SQL Scripts](#dependencies-and-sql-scripts) to refresh source-bound API dependencies, then rebuild the isolated test image with `bin/dev build test_api`.

## VS Code Test-File Configuration

The [Create Test File extension](https://marketplace.visualstudio.com/items?itemName=klondikemarlen.create-test-file) uses this configuration in workspace settings or `.vscode/settings.json`. When stored in workspace configuration, put these values inside its `"settings"` object.

```json
{
  "createTestFile.nameTemplate": "{filename}.test.{extension}",
  "createTestFile.languages": {
    "[vue]": {
      "createTestFile.nameTemplate": "{filename}.test.{extension}.ts"
    }
  },
  "createTestFile.pathMaps": [
    {
      "pathPattern": "(api)/src/?(.*)",
      "testFilePathPattern": "$1/tests/$2"
    },
    {
      "pathPattern": "(web)/src/?(.*)",
      "testFilePathPattern": "$1/tests/$2"
    }
  ],
  "createTestFile.isTestFileMatchers": [
    "^(?:test|spec)s?/",
    "/(?:test|spec)s?/",
    "/?(?:test|spec)s?_",
    "/?_(?:test|spec)s?",
    "/?\\.(?:test|spec)s?",
    "/?(?:test|spec)s?\\."
  ]
}
```
