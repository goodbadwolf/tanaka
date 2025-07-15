import { spawnSync } from "node:child_process"
import packageJson from "./package.json"

// Get the current git commit hash.
const gitCommit = spawnSync("git", ["rev-parse", "--short", "HEAD"])
  .stdout.toString()
  .trim()

// Don't forget to add your added variables to vite-env.d.ts also!

// These variables are available in your Vue components and will be replaced by their values at build time.
// These will be compiled into your app. Don't store secrets here!

const raw: Record<string, string> = {
  VERSION: packageJson.version,
  NAME: packageJson.name,
  DISPLAY_NAME: packageJson.displayName,
  GIT_COMMIT: gitCommit,
  GITHUB_URL: packageJson.repository.url,
  // Set the HTML title for all pages from package.json so you can use %HTMLTITLE% in your HTML files.
  HTML_TITLE: packageJson.displayName,
}

const define: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([k, v]) => [`__${k}__`, JSON.stringify(v)]),
)

export { define, raw }
