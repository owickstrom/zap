var Lexer = require('../lex/lexer.js');
var Token = require('../lex/token.js');
var TokenScanner = require('./token-scanner.js');
var Keyword = require('../lang/keyword.js');
var m = require('mori');

var readerFns = {};

function readOne(reader, type) {
  var token = reader.scanner.next();

  if (token.type !== type) {
    reader.scanner.backup()
    reader.unexpectedToken(token)
  }

  return token;
}

function readSimple(type, construct) {
  return function (reader) {
    return construct(readOne(reader, type));
  };
}

function makeReadEnclosed(before, after, construct) {
  return function readEnclosed(reader) {
    var inner = [];

    var first = readOne(reader, before);

    if (first === null) {
      return reader.unexpectedToken(first)
    }

    while (true) {
      var token = reader.scanner.next();

      if (token === null) {
        return reader.unexpectedToken(first)
      }

      // The enclosed structure got closed, we're done!
      if (token.type === after) {
        return construct(inner);
      }

      // Try to get a reader fn.
      if (readerFns.hasOwnProperty(token.type)) {
        var readFn = readerFns[token.type];

        // Ignored tokens.
        if (readFn === null) {
          continue
        }

        reader.scanner.backup();
        var read = readFn.call(null, reader);

        inner.push(read);
      } else {
        // Throw error if no matching reader fn is found.
        reader.unexpectedToken(token);
      }
    }
  };
}

// List
readerFns[Token.LEFT_PARENTHESIS] = makeReadEnclosed(
  Token.LEFT_PARENTHESIS,
  Token.RIGHT_PARENTHESIS,
  function (elements) {
    return m.list.apply(null, elements);
  });

// Vector
readerFns[Token.LEFT_BRACKET] = makeReadEnclosed(
  Token.LEFT_BRACKET,
  Token.RIGHT_BRACKET,
  function (elements) {
    return m.vector.apply(null, elements);
  });

// Map
readerFns[Token.LEFT_CURLY_BRACKET] = makeReadEnclosed(
  Token.LEFT_CURLY_BRACKET,
  Token.RIGHT_CURLY_BRACKET,
  function (elements) {
    return m.map.apply(null, elements);
  });

function readString(reader) {
  readOne(reader, Token.STRING_START);
  var content = readOne(reader, Token.STRING_CONTENT);
  readOne(reader, Token.STRING_END);

  // TODO: Is there a better way to parse string literals? I hope so...
  return JSON.parse('"' + content.text + '"');
};
readerFns[Token.STRING_START] = readString;

readerFns[Token.KEYWORD] = readSimple(Token.KEYWORD, function (token) {
  return new Keyword(token.text);
});

// Ignored tokens.
readerFns[Token.COMMENT_START] = null;
readerFns[Token.COMMENT_CONTENT] = null;
readerFns[Token.WHITESPACE] = null;

function Reader(scanner) {
  this.scanner = scanner;
}

Reader.prototype.unexpectedToken = function (token) {
  // TODO: Better error message with line/column etc.
  throw new Error('Unexpected token ' + token.type);
};

Reader.prototype.read = function () {
  var token = this.scanner.peek();

  if (readerFns.hasOwnProperty(token.type)) {
    var readFn = readerFns[token.type];

    if (readFn === null) {
      return null
    }

    var result = readFn.call(null, this);
    return result;
  } else {
    // Throw error if no matching reader fn is found.
    this.unexpectedToken(token);
  }
};

Reader.readString = function (s) {
  var lexer = new Lexer(s);
  var scanner = new TokenScanner(lexer);
  var reader = new Reader(scanner)
  return reader.read();
};

module.exports = Reader;
