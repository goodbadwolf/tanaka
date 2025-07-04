export default {
  "{src,scripts}/**/*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
  "{src,scripts}/**/*.{json,css,html}": ["prettier --write"],
  "*.{json,md}": ["prettier --write"],
  "**/*.{ts,tsx}": () => "tsc --noEmit"
};
