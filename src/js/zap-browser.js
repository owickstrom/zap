var Lexer = require('./lex/lexer.js');
var Runtime = require('./runtime/runtime.js');
var printString = require('./lang/print-string.js');

module.exports = {
  printString: printString,
  Runtime: Runtime
};
