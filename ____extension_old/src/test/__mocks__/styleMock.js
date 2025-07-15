const styleProxy = new Proxy({}, {
  get: (target, prop) => {
    // Return the property name as the class name
    return prop;
  },
});

// Support both named and default exports
module.exports = styleProxy;
module.exports.default = styleProxy;
