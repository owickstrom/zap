var character = require('./character.js');
var Token = require('./token.js');

exports.lexWhitespace = function lexWhitespace(lexer) {
  while (true) {
    var c = lexer.read();

    if (!character.isWhitespace(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.WHITESPACE);
        return lexer.endWith(Token.EOF);
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.WHITESPACE);

      // TODO: Add lexer fns for newline and comment.
      return exports.lexSymbol;
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
      return lexer.endWith(Token.EOF);
    }

    if (enclosing.hasOwnProperty(c)) {
      lexer.emit(enclosing[c]);
    } else {
      lexer.backup();
      return exports.lexWhitespace;
    }
  }
};

exports.lexSymbol = function lexSymbol(lexer) {
  var first = true;

  while (true) {
    var c = lexer.read();

    if (first && character.isDigit(c)) {
      return lexer.error('Symbols must not begin with a digit');
    }

    if (!character.isValidSymbolCharacter(c)) {

      // EOF
      if (c === null) {
        lexer.emitIfNotBlank(Token.SYMBOL);
        return lexer.endWith(Token.EOF);
      } else {
        lexer.backup()
      }

      lexer.emitIfNotBlank(Token.SYMBOL);

      // TODO: Add more lexer fns here...

      if (character.isWhitespace(c)) {
        return exports.lexWhitespace;
      } else if (enclosing.hasOwnProperty(c)) {
        return exports.lexEnclosing;
      } else if (first && character.isColon(c)) {
        // If we haven't started reading this as a symbol and
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

    if (!first && !character.isValidSymbolCharacter(c)) {

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
