var character = require('./character.js');
var Token = require('./token.js');

exports.lexWhitespace = function lexWhitespace(lexer) {
  while (true) {
    var c = lexer.read();

    if (!character.isWhitespace(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.WHITESPACE);
        return lexer.eof();
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.WHITESPACE);

      // TODO: Add lexer fns for newline and comment.
      return exports.lexName;
    }
  }
};

var enclosing = {
  '(': Token.LEFT_PARENTHESIS,
  ')': Token.RIGHT_PARENTHESIS,
  '[': Token.LEFT_BRACKET,
  ']': Token.RIGHT_BRACKET,
  '{': Token.LEFT_CURLY_BRACKET,
  '}': Token.RIGHT_CURLY_BRACKET
}

exports.lexEnclosing = function lexEnclosing(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      return lexer.eof();
    }

    if (enclosing.hasOwnProperty(c)) {
      lexer.emit(enclosing[c]);
    } else {
      lexer.backup();
      return exports.lexWhitespace;
    }
  }
};

var readerMacros = {
  '\'': Token.QUOTE
};

exports.lexReaderMacros = function lexReaderMacros(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      return lexer.eof();
    }

    if (readerMacros.hasOwnProperty(c)) {
      lexer.emit(readerMacros[c]);
    } else {
      lexer.backup();
      return exports.lexWhitespace;
    }
  }
};

exports.lexName = function lexName(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first) {
      var c2 = lexer.peek();

      if (character.isValidFirstTwoCharactersInNumber(c, c2)) {
        lexer.backup();
        return exports.lexNumberSignPrefix;
      } else if (character.isDigit(c)) {
        return lexer.unexpectedCharacter(c);
      }
    }
    if (!character.isValidNameCharacter(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.NAME);
        return lexer.eof();
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.NAME);

      // TODO: Add more lexer fns here...

      if (character.isWhitespace(c)) {
        return exports.lexWhitespace;
      } else if (enclosing.hasOwnProperty(c)) {
        return exports.lexEnclosing;
      } else if (readerMacros.hasOwnProperty(c)) {
        return exports.lexReaderMacros;
      } else if (character.isQuote(c)) {
        return exports.lexStringStart;
      } else if (character.isSemicolon(c)) {
        return exports.lexCommentStart;
      } else if (first && character.isColon(c)) {
        // If we haven't started reading this as a name and
        // a colon shows up, then it should be a keyword.
        return exports.lexKeyword;
      } else {
        return lexer.unexpectedCharacter(c);
      }
    }

    first = false;
  }
};

exports.lexKeyword = function lexKeyword(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first && !character.isColon(c)) {
      return lexer.error('Keywords must begin with a colon');
    }

    if (!first && !character.isValidNameCharacter(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.KEYWORD);
        return lexer.eof();
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.KEYWORD);
      return exports.lexWhitespace;
    }

    first = false;
  }
};

exports.lexCommentStart = function lexCommentStart(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      lexer.emitIfNotBlank(Token.COMMENT_START);
      return lexer.eof();
    }

    if (!character.isSemicolon(c)) {
      lexer.backup()
      lexer.emitIfNotBlank(Token.COMMENT_START);

      return exports.lexCommentContent;
    }
  }
};

exports.lexCommentContent = function lexCommentContent(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      lexer.emit(Token.COMMENT_CONTENT);
      return lexer.eof();
    }

    // New line
    if (character.isNewline(c)) {
      lexer.backup()
      lexer.emit(Token.COMMENT_CONTENT);

      return exports.lexWhitespace;
    }
  }
};

exports.lexStringStart = function lexStringStart(lexer) {
  var c = lexer.read();

  // EOF
  if (c === null) {
    return lexer.eof();
  }

  if (character.isQuote(c)) {
    lexer.emit(Token.STRING_START);
    return exports.lexStringContent;
  } else {
    lexer.backup()
    return exports.lexWhitespace;
  }
};

exports.lexStringContent = function lexStringContent(lexer) {
  var last;
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      lexer.emit(Token.STRING_CONTENT);
      return lexer.eof();
    }

    var escaped = last === '\\';

    if (character.isQuote(c) && !escaped) {
      lexer.backup()
      lexer.emit(Token.STRING_CONTENT);

      return exports.lexStringEnd;
    }

    last = c;
  }
};

exports.lexStringEnd = function lexStringEnd(lexer) {
  var c = lexer.read();

  // EOF
  if (c === null) {
    return lexer.eof();
  }

  if (character.isQuote(c)) {
    lexer.emit(Token.STRING_END);
    return exports.lexWhitespace;
  } else {
    return lexer.unexpectedCharacter(c)
  }
};

exports.lexNumberSignPrefix = function lexNumberSignPrefix(lexer) {
  var c = lexer.read();

  if (c === null) {
    return lexer.eof();
  }

  if (c === '-' || c === '+') {
    lexer.emit(Token.NUMBER_SIGN_PREFIX);
    return exports.lexNumberInteger;
  } else if (character.isDigit(c)) {
    lexer.backup();
    return exports.lexNumberInteger;
  } else {
    lexer.backup();
    return lex.unexpectedCharacter(c);
  }
};

exports.lexNumberInteger = function lexNumberInteger(lexer) {
  while (true) {
    var c = lexer.read();

    if (c === null) {
      lexer.emitIfNotBlank(Token.NUMBER_INTEGER);
      return lexer.eof();
    }

    if (character.isDigit(c)) {
      continue;
    } else if (c === '.') {

      // First emit integer part.
      lexer.backup();
      lexer.emitIfNotBlank(Token.NUMBER_INTEGER);

      // Re-read dot and emit.
      lexer.read();
      lexer.emit(Token.DOT);

      return exports.lexNumberDecimals;
    } else {
      lexer.backup();
      lexer.emitIfNotBlank(Token.NUMBER_INTEGER);
      return exports.lexWhitespace;
    }
  }
};

exports.lexNumberDecimals = function lexNumberDecimals(lexer) {
  while (true) {
    var c = lexer.read();

    if (c === null) {
      lexer.emitIfNotBlank(Token.NUMBER_DECIMALS);
      return lexer.eof();
    }

    if (character.isDigit(c)) {
      continue;
    } else {
      lexer.backup();
      lexer.emitIfNotBlank(Token.NUMBER_DECIMALS);
      return exports.lexWhitespace;
    }
  }
};
