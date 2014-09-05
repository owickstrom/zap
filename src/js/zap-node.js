var Runtime = require('./runtime/runtime.js');
var NodeJSLoader = require('./runtime/node-js-loader.js');
var printString = require('./lang/print-string.js');
var ZapError = require('./lang/zap-error.js');
var path = require('path');
var mori = require('mori');
var chalk = require('chalk');

var loader = new NodeJSLoader();
var rt = new Runtime(loader);

var args = process.argv[0] === 'node' ? process.argv.slice(1) : process.argv;

if (args.length < 3) {
  console.error('Usage: zap command [args]');
  process.exit(1);
}

var command = args[1];
var file = args[2];

function printError(err) {
  if (err instanceof ZapError) {
    var lines = err.stack.split('\n');
    var s = chalk.red.underline.bold(lines[0]) + '\n';

    lines.slice(1).forEach(function (line) {
      if (/\(.+?\.zap:/.test(line)) {
        s += chalk.red(line) + '\n';
      } else {
        s += chalk.gray(line) + '\n';
      }
    });
    console.error(s);
  } else {
    console.error(err);
  }
}

rt.start().then(function () {

  if (command === 'run') {
    rt.loadFile(file).then(function (result) {
      console.log(printString(mori.last(result)));
      process.exit(0);
    }, function (e) {
      printError(e);
      process.exit(2);
    });
  } else {
    console.error('Unknown command: ' + command);
    process.exit(1);
  }

}, console.error);
