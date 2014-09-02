var Lexer = require('../lex/lexer.js');
var Token = require('../lex/token.js');
var TokenScanner = require('./token-scanner.js');
var Symbol = require('../lang/symbol.js');
var keyword = require('../lang/keyword.js');
var PkgName = require('../lang/pkg-name.js');
var MethodName = require('../lang/method-name.js');
var PropertyName = require('../lang/property-name.js');
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
  var token = readOne(reader, Token.NAME);

  if (token === null) {
    return reader.eof();
  }

  var splitBySlash = token.text.split('/');

  if (token.text === '/') {
    return Symbol.withoutPkg('/');
  } else if (splitBySlash.length === 1) {
    if (token.text.indexOf('.-') === 0) {
      return new PropertyName(token.text.slice(2));
    } else if (token.text.indexOf('.') === 0) {
      return new MethodName(token.text.slice(1));
    }
    var splitByDot = token.text.split('.');
    if (splitByDot.length === 1) {
      return symbolOrLiteral(token.text);
    } else {
      return new PkgName(splitByDot);
    }
  } else if (splitBySlash.length === 2) {
    var pkgName = new PkgName.fromString(splitBySlash[0]);
    return Symbol.inPkg(splitBySlash[1], pkgName);
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

function readNumber(reader) {
  var prefix, integer, decimals, last;

  while (true) {
    var t = reader.scanner.next();

    if (t === null || t.type === Token.EOF || t.type === Token.WHITESPACE) {
      break;
    } else {
      if (t.type === Token.NUMBER_SIGN_PREFIX) {
        prefix = t;
      } else if (t.type === Token.NUMBER_INTEGER) {
        integer = t;
      } else if (t.type === Token.NUMBER_DECIMALS) {
        decimals = t;
      } else if (t.type !== Token.DOT) {
        reader.scanner.backup();
        break;
      }
      // Store this to be able to report correct location of unexpected token.
      last = t;
    }

  }

  var s = '';

  if (prefix) {
    s += prefix.text;
  }

  if (integer) {
    s += integer.text;
  }

  if (decimals) {
    return parseFloat(s + '.' + decimals.text);
  } else {
    return parseInt(s);
  }
};
readerFns[Token.NUMBER_SIGN_PREFIX] = readNumber;
readerFns[Token.NUMBER_INTEGER] = readNumber;

readerFns[Token.KEYWORD] = readSimple(Token.KEYWORD, function (token) {
  return keyword.fromString(token.text);
});

// Ignored tokens.
readerFns[Token.COMMENT_START] = null;
readerFns[Token.COMMENT_CONTENT] = null;
readerFns[Token.WHITESPACE] = null;

function makeReaderMacro(before, construct) {
  return function readReaderMacro(reader) {
    var first = readOne(reader, before);

    if (first === null) {
      return reader.unexpectedToken(first);
    }

    var token = reader.scanner.next();

    if (token === null) {
      return reader.unexpectedToken(first);
    }

    // Try to get a reader fn.
    if (readerFns.hasOwnProperty(token.type)) {
      var readFn = readerFns[token.type];

      reader.scanner.backup();
      var read = readFn.call(null, reader);

      return construct(read);
    } else {
      // Throw error if no matching reader fn is found.
      reader.unexpectedToken(token);
    }
  };
}

readerFns[Token.QUOTE] = makeReaderMacro(Token.QUOTE, function (inner) {
  return m.list(Symbol.withoutPkg('quote'), inner);
});

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
