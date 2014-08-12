var Runtime = require('./runtime/runtime.js');
var NodeJSLoader = require('./runtime/node-js-loader.js');
var printString = require('./lang/print-string.js');
var path = require('path');
var mori = require('mori');

var loader = new NodeJSLoader();
var rt = new Runtime(loader);

var args = process.argv[0] === 'node' ? process.argv.slice(1) : process.argv;

if (args.length < 2) {
  console.error('Usage: zap command [args]');
  process.exit(1);
}

var file = args[1];

rt.loadFile(file).then(function (result) {
  process.exit(0);
}, function (e) {
  console.error('Error', e);
  process.exit(2);
});
