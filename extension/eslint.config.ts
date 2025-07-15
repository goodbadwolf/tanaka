import { includeIgnoreFile } from "@eslint/compat"
import pluginJs from "@eslint/js"
import pluginVue from "eslint-plugin-vue"
import globals from "globals"
import path from "node:path"
import { fileURLToPath } from "node:url"
import tseslint from "typescript-eslint"
import { define } from "./define.config"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, ".gitignore")
const viteDefineGlobals = Object.keys(define).reduce(
  (acc, key) => {
    acc[key] = "readonly"
    return acc
  },
  {} as Record<string, string>,
)

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "node_modules",
      "dist",
      "**/*.js",
      "**/*.d.ts",
      "public",
      "build",
      "coverage",
      "tests",
      "cypress",
      "src/types/**/*",
      "eslint.config.ts",
    ],
  },
  { files: ["**/*.{js,mjs,cjs,ts,vue}"] },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.worker,
        ...globals.webextensions,
        ...viteDefineGlobals,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "no-restricted-globals": "error",
      "vue/multi-word-component-names": "error",
      "vue/singleline-html-element-content-newline": "off",
      "vue/require-default-prop": "error",
    },
  },
  {
    files: ["**/*.cjs", "scripts/**/*.{js,mjs,cjs,ts,vue}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/pages/**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
]
