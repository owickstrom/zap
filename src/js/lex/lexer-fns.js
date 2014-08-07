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

exports.lexName = function lexName(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first) {
      if (character.isDigit(c)) {
        return lexer.error('Names must not begin with a digit');
      }
      if (character.isHyphen(c)) {
        return lexer.error('Names must not begin with a hyphen');
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
      } else if (singles.hasOwnProperty(c)) {
        return exports.lexSingle;
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

var singles = {
  '.': Token.DOT,
  '-': Token.HYPHEN,
  '/': Token.SLASH
};

exports.lexSingle = function lexSingle(lexer) {
  while (true) {
    var c = lexer.read();

    // EOF
    if (c === null) {
      return lexer.eof();
    }

    if (singles.hasOwnProperty(c)) {
      lexer.emit(singles[c]);
    } else {
      lexer.backup();
      return exports.lexWhitespace;
    }
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
