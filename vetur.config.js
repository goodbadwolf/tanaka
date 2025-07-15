// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
  settings: {
    "vetur.useWorkspaceDependencies": true,
    "vetur.experimental.templateInterpolationService": true,
  },
  projects: [
    {
      root: "./extension",
      package: "./package.json",
      tsconfig: "./tsconfig.json",
      snippetFolder: "./.vscode/vetur/snippets",
      globalComponents: [
        "./src/components/**/*.vue",
        "./src/ui/**/*.vue"
      ],
    },
  ],
};
