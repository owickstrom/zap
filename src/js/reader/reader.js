var Lexer = require('../lex/lexer.js');
var Token = require('../lex/token.js');
var TokenScanner = require('./token-scanner.js');
var Symbol = require('../lang/symbol.js');
var Keyword = require('../lang/keyword.js');
var PkgName = require('../lang/pkg-name.js');
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

function symbolOrLiteral(text) {
  switch (text) {
    case 'nil':
      return null;
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return Symbol.withoutPkg(text)
  }
}

function readSymbol(reader) {
  var segments = [];
  var last;
  var slash;
  var hasReadName = false;

  while (true) {
    var token = reader.scanner.next();

    if (token.type === Token.NAME) {

      // Symbols cannot follow symbols.
      if (last && last.type === Token.NAME) {
        return reader.unexpectedToken(token);
      }

      // A token after a slash is the name.
      if (slash) {

        // Unless we've already read the name.
        if (hasReadName) {
          return reader.unexpectedToken(token);
        }

        hasReadName = true;
      }

      segments.push(token.text);

    } else if (token.type === Token.SLASH) {

      // A slash can only occur after a symbol.
      if (last && last.type !== Token.NAME) {
        return reader.unexpectedToken(token);
      }

      // Multiple slashes or a slash after the name is not ok.
      if (slash || hasReadName) {
        return reader.unexpectedToken(token);
      }

      slash = token;

    } else if (token.type === Token.DOT) {

      // Dots can only occur after a symbol.
      if (last && last.type !== Token.NAME) {
        return reader.unexpectedToken(token);
      }

      // Dots after a slash and name is not ok.
      if (slash || hasReadName) {
        return reader.unexpectedToken(token);
      }

    } else {
      // Backup and try to read the segments as a symbol.
      reader.scanner.backup();
      break;
    }
    last = token;
  }

  switch (segments.length) {
    case 0:
      throw new Error('No symbol tokens read')
    case 1:
      if (slash) {
        return reader.unexpectedToken(slash);
      }
      return symbolOrLiteral(segments[0]);
    default:
      if (slash) {
        if (!hasReadName) {
          return reader.missing(Token.NAME, slash.position.plus(0, 1))
        }
        var last = segments.length - 1;
        var name = new PkgName(segments.slice(0, last));
        return Symbol.inPkg(segments[last], name);
      }
      return new PkgName(segments);
  }
}
readerFns[Token.NAME] = readSymbol;

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
    return m.hash_map.apply(null, elements);
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
  throw new Error(
    'Unexpected token ' +
    token.type +
    ' "' +
    token.text +
    '" at ' +
    token.position.toString());
};

Reader.prototype.missing = function (type, position) {
  throw new Error('Missing ' + type + ' at ' + position.toString());
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

Reader.prototype.readTopLevelForms = function () {
  var forms = m.vector();

  while (true) {
    var token = this.scanner.next();

    if (!token || token.type === Token.EOF) {
      break;
    }

    var isIgnored = token.type === Token.COMMENT_START ||
               token.type === Token.COMMENT_CONTENT ||
               token.type === Token.EOF ||
              token.type === Token.WHITESPACE;

    if (token.type === Token.LEFT_PARENTHESIS) {
      var readFn = readerFns[token.type];

      this.scanner.backup();
      var result = readFn.call(null, this);
      forms = m.conj(forms, result);
    } else if (isIgnored) {
      continue;
    } else {
      this.unexpectedToken(token);
    }
  }

  return forms;
};

Reader.readString = function (s) {
  var lexer = new Lexer(s);
  var scanner = new TokenScanner(lexer);
  var reader = new Reader(scanner)
  return reader.read();
};

Reader.readTopLevelFormsString = function (s) {
  var lexer = new Lexer(s);
  var scanner = new TokenScanner(lexer);
  var reader = new Reader(scanner)
  return reader.readTopLevelForms();
};

module.exports = Reader;
