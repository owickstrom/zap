var isInterop = require('./is-interop.js');
var Promise = require('es6-promise').Promise;

function BrowserInterop() {
}

BrowserInterop.prototype.resolve = function (symbol) {
  return new Promise(function (resolve, reject) {
    if (!isInterop(symbol)) {
      return reject(new Error('Could not resolve: ' + symbol.toString()));
    }

    var prop = symbol.name;
    return resolve(window[prop]);
  });
};

module.exports = BrowserInterop;
