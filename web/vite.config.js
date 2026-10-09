/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url"

// Plugins
import vue from "@vitejs/plugin-vue"
import vuetify from "vite-plugin-vuetify"

// Utilities
import { defineConfig } from "vite"

const gatewayUrlLogger = {
  name: "gateway-url-logger",
  apply: "serve",
  configureServer(server) {
    server.httpServer?.once("listening", () => {
      const hostname = process.env.GATEWAY_HOSTNAME || "elcc-data-management.localhost"
      console.log(`\n  Open ELCC: http://${hostname}/`)
    })
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: {
        labs: true,
      },
    }),
    gatewayUrlLogger,
  ],
  build: {
    outDir: "./dist",
  },
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@/tests": fileURLToPath(new URL("./tests", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 8080,
    proxy: {
      // Forward editor-open requests to the configured host editor bridge.
      "/__open-in-editor": {
        target: `http://host.docker.internal:${process.env.OPEN_IN_EDITOR_BRIDGE_PORT || "3333"}`,
        rewrite(path) {
          const editorRequest = new URL(path, "http://host.docker.internal")
          editorRequest.searchParams.set("session", process.env.OPEN_IN_EDITOR_SESSION_ID)
          return `${editorRequest.pathname}${editorRequest.search}`
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true, // https://vitest.dev/config/#globals
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
    setupFiles: ["./tests/setup.ts"],
    // Mocking
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // Mock CSS imports
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
  },
})
