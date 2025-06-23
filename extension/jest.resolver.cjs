module.exports = (path, options) => {
  // Strip .js extension from TypeScript imports during Jest resolution
  const jsExtensionRegex = /\.js$/;
  if (jsExtensionRegex.test(path)) {
    const pathWithoutJs = path.replace(jsExtensionRegex, '');
    try {
      return options.defaultResolver(pathWithoutJs, options);
    } catch {
      // If resolution fails without .js, try with .js
    }
  }
  return options.defaultResolver(path, options);
};