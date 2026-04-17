import { execSync } from "child_process"

export default async function globalSetup() {
  if (process.env.VITEST_SKIP_GLOBAL_SETUP === "true") {
    return
  }

  try {
    // Keep in sync with api/bin/boot-app.sh
    execSync(`npm run initializers`, { stdio: "inherit" })
  } catch (error) {
    console.error("Failed to run initializers:", error)
    process.exit(1)
  }
}
