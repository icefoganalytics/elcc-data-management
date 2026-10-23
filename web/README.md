# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Testing

See [Web Tests](tests/README.md) for commands and component-test conventions.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

---

## Open In Editor

When the frontend runs in Docker, Vue Devtools cannot launch your host editor directly from inside the container. This project handles that by:

- Using the `open-in-editor-bridge` gem's mounted Vite plugin to proxy editor requests.
- Translating container paths like `/usr/src/web/...` back to your host checkout path.
- Launching `devin-desktop --goto ...` on the host by default.

If you use the repo-level `dev` wrapper, this is automatic:

- `dev up` uses the gem's Compose adapter to start the bridge and mount its plugin and checkout identity.
- `dev down` releases this checkout without stopping another active editor session.

Use `./bin/dev up web` when the frontend needs editor integration. Only adapter-backed
development startup enables `OPEN_IN_EDITOR_BRIDGE_ENABLED` and supplies the required
mounts. Ordinary Compose commands, including `dev web npm run start`, start Vite without
editor integration. Explicitly enabled startup fails if its mounts are missing; tests
and production configurations do not load the plugin.

The bridge prefers `OPEN_IN_EDITOR_COMMAND`, then `EDITOR`, and falls back to `devin-desktop`.
