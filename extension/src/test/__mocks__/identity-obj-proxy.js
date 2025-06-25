// Identity object proxy for CSS modules
// Returns the key as the value for any property access
module.exports = new Proxy({}, {
  get: function(target, key) {
    if (key === '__esModule') {
      return false;
    }
    return key;
  }
});