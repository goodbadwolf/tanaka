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
  // Vue files configuration
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  // TypeScript files with type-aware rules (only for files in tsconfig.json)
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript rules that require type information
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
    },
  },
  // General rules for all files
  {
    rules: {
      // TypeScript rules for better type safety
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

      // General JavaScript rules
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "no-restricted-globals": "error",

      // Import/export rules for better organization
      "sort-imports": ["error", { ignoreDeclarationSort: true }],
      "no-duplicate-imports": "error",

      // Performance rules
      "no-await-in-loop": "error",
      "prefer-const": "error",
      "no-var": "error",

      // Vue rules for better code quality
      "vue/multi-word-component-names": "error",
      "vue/singleline-html-element-content-newline": "off",
      "vue/require-default-prop": "error",
      "vue/no-unused-components": "error",
      "vue/component-definition-name-casing": ["error", "PascalCase"],
      "vue/prefer-import-from-vue": "error",
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
