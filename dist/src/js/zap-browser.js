var Runtime = require('./runtime/runtime.js');
var BrowserLoader = require('./runtime/browser-loader.js');
var printString = require('./lang/print-string.js');

module.exports = {
  printString: printString,
  Runtime: Runtime,
  BrowserLoader: BrowserLoader
};
