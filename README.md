# Early Learning Childcare Centre - Data Management Application

## Production - building locally

1. Create an `api/.env.production` file from the `api/.env.sample` file and fill with the appropriate matching the local development config with some minor changes.

   ```bash
   VUE_APP_FRONTEND_URL=http://localhost:8080
   VUE_APP_AUTH_DOMAIN=some-url
   VUE_APP_AUTH_CLIENTID=some-secret
   VUE_APP_AUTH_AUDIENCE=testing

   AUTH_REDIRECT=http://localhost:8080/dashboard
   AUTH0_AUDIENCE=testing
   AUTH0_DOMAIN=some-url

   APPLICATION_NAME=ELCC Data Management
   API_PORT=8080

   NODE_ENV=production

   DB_NAME=ELCC
   DB_HOST=db
   DB_USER=sa
   DB_PASS=DevPwd99!
   DB_PORT=1433
   ```

   > replace the `VUE_APP_AUTH_DOMAIN`, `VUE_APP_AUTH_CLIENTID`, and `AUTH0_DOMAIN` with appropriate values.

2. Duplicate the `api/.env.production` to `.env` at the top level.

3. Run `docker compose up --build` to build the application and boot it locally.

4. (optional) If you want to run seeds you can do that manually via:

   ```
   dc exec app sh
   NODE_ENV=development node
   const { runSeeds } = require("./dist/initializers/30-run-seeds.js")
   runSeeds().then(console.log)
   ```

5. Go to http://localhost:8080/ and sign in to the app.

## Development

### Set up `dev` command

The `dev` command vastly simplifies development using docker compose. It requires `ruby`, though `direnv` and `asdf` will make it easier to use.

It's more or less simply a wrapper around docker compose with the ability to quickly add custom helpers.

All commands are just strings joined together, so it's easy to add new commmands. `dev` prints out each command that it runs, so that you can run the command manually to debug it, or just so you learn some docker compose while using it.

1. (optional) Install `asdf` as seen in https://asdf-vm.com/guide/getting-started.html.

   e.g. for Linux

   ```bash
   apt install curl git

   git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.12.0

   echo '
   # asdf
   . "$HOME/.asdf/asdf.sh"
   . "$HOME/.asdf/completions/asdf.bash"
   ' >> ~/.bashrc
   ```

2. Install `ruby` via `asdf` as seen here https://github.com/asdf-vm/asdf-ruby, or using whatever custom Ruby install method works for your platform.

   e.g. for Linux

   ```bash
   asdf plugin add ruby https://github.com/asdf-vm/asdf-ruby.git

   # install version from .tool-versions file
   asdf install ruby

   asdf reshim ruby
   ```

3. Install the Ruby dependencies:

   ```bash
   bundle install
   ```

   You can now run the `./bin/dev` command.

4. (optional) Install [direnv](https://direnv.net/) and create an `.envrc` with

   ```bash
    #!/usr/bin/env bash

    PATH_add bin
   ```

   and then run `direnv allow`.

   You can now run `dev xxx` instead of `./bin/dev xxx`.

### Boot the Application

1. Create a `api/.env.development` file with the following content:

   ```bash
   VUE_APP_FRONTEND_URL=http://elcc-data-management.localhost
   VUE_APP_AUTH_DOMAIN=https://dev-0tc6bn14.eu.auth0.com
   VUE_APP_AUTH_CLIENTID=9LYlWVby1DLUu7SDUiCcvorVXqAlCMYs
   VUE_APP_AUTH_AUDIENCE=testing

   AUTH0_AUDIENCE=testing
   AUTH0_DOMAIN=https://dev-0tc6bn14.eu.auth0.com

   APPLICATION_NAME=ELCC Data Management
   ```

2. In each new checkout, install the ignored source-bound dependencies before starting services:

   ```bash
   dev api npm clean-install
   dev web npm clean-install
   ```

3. Boot the API, web, and database services, and run migrations and seeds:

   ```bash
   dev up --build
   ```

   The command starts or reuses the shared loopback gateway. The base checkout is available at
   http://elcc-data-management.localhost and its API at
   http://api.elcc-data-management.localhost.

   A separately named worktree has its own hostname. For example, a checkout named
   `issue-112-concurrent-local-development` is available at
   http://issue-112-concurrent-local-development.elcc-data-management.localhost.

4. Connect a SQL Server client on port `1433` using the hostname for the current checkout:
   - Base checkout: `db.elcc-data-management.localhost`
   - `issue-112-concurrent-local-development` worktree:
     `db.issue-112-concurrent-local-development.elcc-data-management.localhost`

   Enable encryption and trust the server certificate.

5. Run `dev down` to stop this checkout's services. The gateway stays running while other
   projects use it.

> The development Auth0 client must allow `http://*.elcc-data-management.localhost` as a
> callback URL, logout URL, and web origin before sign-in can succeed.

> NOTE: make sure you delete the .env file before runing a development setup again as it is auto-loaded by docker compose.

> NOTE: You can also skip seeding when database is not empty by setting the `SKIP_SEEDING_UNLESS_EMPTY=true` environment variable.

### Editor Setup

Your text editor or IDE might require you to manually install the dependencies to get TypesScript autocompletion working. Hopefully, it "just works :tm:". If not you can install packages locally like so:

1. Install `asdf` using instructions from [README -> Set Up dev Commnd](./README.md#set-up-dev-command)

2. Install the `nodejs` plugin via and the appropriate nodejs version.

   ```bash
   asdf plugin add nodejs

   # install the version from the .tool-verions file
   asdf install nodejs
   ```

   Check that you have the correct version set up by seeing that these two commands match:

   ```bash
   asdf current nodejs
   node -v
   ```

3. Go to `./api` and run `npm install`

4. Go to `./web` and run `npm install`

5. Install Ruby dependencies for prettification and language server support:

   ```bash
   bundle install
   ```

   This installs Ruby gems for:
   - Ruby LSP (language server for IDE support)
   - Syntax Tree (Ruby code formatting)
   - Prettier Print (pretty printing Ruby objects)

6. Configure your editor to use Ruby LSP as the default formatter for `.rb` files:
   - VS Code: Right-click on a `.rb` file → "Format Document With..." → "Configure Default Formatter..." → "Ruby (LSP)"
   - Or use Command Palette: `Ctrl+Shift+P` → "Format Document With..." → "Ruby (LSP)"
   - Other editors: Configure Ruby formatter to use `bundle exec stree format`

### Linting and Pretification

Linting and prettification support easier collaborator by standardizing code.
They also can make programming faster as you no longer need to worry about formatting, as it happens automatically.

To enable linting and prettification:

1. Install the root level packages via `npm install`

2. Install the recommended extensions for VS Code

3. Reboot VS Code.

4. TODO: test on a second machine and see if more instructions are needed.

## Migrations - Database Management

This project uses [Knex](https://knexjs.org/) for migrations and seeds, and Sequelize for the
application ORM. Database table and column names use snake_case.

```bash
./bin/dev migrate make add-field-to-table
./bin/dev migrate
./bin/dev migrate list
```

Migration files live in [`api/src/db/migrations`](./api/src/db/migrations/README.md).
The initial table migrations create a fresh database or leave each existing table untouched.
On an existing, current production schema, the cutover adds `knex_migrations` and
`knex_migrations_lock`, then drops obsolete migration history after the table baseline succeeds.
Application tables and data remain unchanged.

Existing databases must already have the current application schema before this cutover.
Historical migrations are no longer executed. Validate a restored production backup before
deployment. The initial table migrations deliberately reject rollback to avoid dropping
existing production tables.

Production runs compiled JavaScript migrations through `node dist/initializers/index.js`.
Development uses TypeScript migrations. Keep those environments on separate databases:
Knex stores the actual filenames, and this project does not rename ledger entries between
`.ts` and `.js` or support obsolete, unreleased PR migration names.

Initialization errors are logged and return a failing status, but `boot-app.sh` intentionally
starts the API afterward so Azure deployments remain accessible for debugging.
An API responding does not mean migrations succeeded; inspect initialization logs.

### Seeding

```bash
./bin/dev api npm run knex -- seed:make fill-users-table
./bin/dev seed
```

Seeds are separated into `api/src/db/seeds/development` and `api/src/db/seeds/production`.
Export `seed(knex)` and keep seeds idempotent: Knex reruns them without a seed-history table.
Tests use factories rather than startup seeds.

### References

- [Knex migrations and seeds](https://knexjs.org/guide/migrations.html)
- [Knex schema builder](https://knexjs.org/guide/schema-builder.html)

### Extras

If you want to take over a directory or file in Linux you can use `dev ownit <path-to-directory-or-file>`.

If you are on Windows or Mac, and you want that to work, you should implement it in the `bin/dev` file. You might never actually need to take ownership of anything, so this might not be relevant to you.

## Testing

### Back-end

Run `dev test_api` to run the back-end tests.

### Front-end

Run `dev test_web` to run the front-end tests.
