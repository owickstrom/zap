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

function highlightLine(marked) {
  if (marked.highlighted) {
    return chalk.red(marked.text);
  } else {
    return chalk.gray(marked.text);
  }
}

function printError(err) {
  if (err instanceof ZapError) {
    var s = err
      .getHighlightedLinesMarked()
      .map(highlightLine)
      .join('\n');
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
