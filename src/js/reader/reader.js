var Lexer = require('../lex/lexer.js');
var Token = require('../lex/token.js');
var TokenScanner = require('./token-scanner.js');

// reader fns
var readList = require('./read-list.js');

var readerFns = {};
readerFns[Token.LEFT_PARENTHESIS] = readList;

function Reader(scanner) {
  this.scanner = scanner;
}

Reader.prototype.unexpectedToken = function (token) {
  // TODO: Better error message with line/column etc.
  throw new Error('Unexpected token ' + token.type);
};

Reader.prototype.read = function () {
  var token = this.scanner.next();

  if (readerFns.hasOwnProperty(token.type)) {
    var readFn = readerFns[token.type];

    if (readFn !== null) {
      return null
    }

    this.scanner.backup()
    return readFn.call(null, token);
  } else {
    // Throw error if no matching read fn is found.
    this.unexpectedToken(token);
  }
};

Reader.readString = function (s) {
  var lexer = new Lexer(s);
  var scanner = new TokenScanner(lexer);
  return new Reader(scanner).read();
};

module.exports = Reader;
