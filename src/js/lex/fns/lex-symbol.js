var character = require('../character.js');
var Token = require('../token.js');
var lexWhitespace = require('./lex-whitespace.js');
var lexEnclosing = require('./lex-enclosing.js');

var enclosing = {
  '(': Token.LEFT_PARENTHESIS,
  ')': Token.RIGHT_PARENTHESIS,
  '[': Token.LEFT_BRACKET,
  ']': Token.RIGHT_BRACKET,
  '{': Token.LEFT_CURLY_BRACKET,
  '}': Token.RIGHT_CURLY_BRACKET
}
var lexAllEnclosing = lexEnclosing(enclosing);

module.exports = function lexSymbol(lexer) {
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
        return lexWhitespace;
      } else if (enclosing.hasOwnProperty(c)) {
        return lexAllEnclosing;
      } else {
        return lexer.unexpectedCharacter(c);
      }
    }

    first = false;
  }
};
