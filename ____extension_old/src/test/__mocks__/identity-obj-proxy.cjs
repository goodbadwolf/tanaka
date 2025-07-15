// Identity object proxy for CSS modules
// Returns the key as the value for any property access
const proxy = new Proxy({}, {
  get: function(target, key) {
    if (key === '__esModule') {
      return true;
    }
    if (key === 'default') {
      return proxy; // For ES module default export
    }
    if (key === Symbol.toPrimitive || key === 'valueOf' || key === 'toString') {
      return function() { return ''; };
    }
    if (typeof key === 'string') {
      return key;
    }
    return key;
  }
});

module.exports = proxy;
