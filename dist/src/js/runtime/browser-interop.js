var isInterop = require('./is-interop.js');
var Promise = require('es6-promise').Promise;

function BrowserInterop() {
}

BrowserInterop.prototype.resolve = function (symbol) {
  if (!isInterop(symbol)) {
    return Promise.reject(new Error('Could not resolve: ' + symbol.toString()));
  }

  var prop = symbol.name;
  return Promise.resolve(window[prop]);
};

module.exports = BrowserInterop;
